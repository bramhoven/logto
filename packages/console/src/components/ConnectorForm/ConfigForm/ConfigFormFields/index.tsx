import type { ConnectorConfigFormItem } from '@logto/connector-kit';
import { ConnectorConfigFormItemType } from '@logto/connector-kit';
import { conditional } from '@silverhand/essentials';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import CodeEditor from '@/ds-components/CodeEditor';
import DangerousRaw from '@/ds-components/DangerousRaw';
import FormField from '@/ds-components/FormField';
import Select from '@/ds-components/Select';
import Switch from '@/ds-components/Switch';
import TextInput from '@/ds-components/TextInput';
import Textarea from '@/ds-components/Textarea';
import type { ConnectorFormType } from '@/types/connector';
import { jsonValidator } from '@/utils/validator';

import * as styles from './index.module.scss';

type Props = {
  formItems: ConnectorConfigFormItem[];
};

function ConfigFormFields({ formItems }: Props) {
  const {
    watch,
    register,
    control,
    formState: {
      errors: { formConfig: formConfigErrors },
    },
  } = useFormContext<ConnectorFormType>();
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  const values = watch('formConfig');

  const filteredFormItems = useMemo(() => {
    return formItems.filter((item) => {
      if (!item.showConditions) {
        return true;
      }

      return item.showConditions.every(({ expectValue, targetKey }) => {
        const targetValue = values[targetKey];

        return targetValue === expectValue;
      });
    });
  }, [formItems, values]);

  const renderFormItem = (item: ConnectorConfigFormItem) => {
    const error = conditional(
      formConfigErrors &&
        (formConfigErrors[item.key]?.message ?? Boolean(formConfigErrors[item.key]))
    );

    const buildCommonProperties = () => ({
      ...register(`formConfig.${item.key}`, {
        required: item.required,
        valueAsNumber: item.type === ConnectorConfigFormItemType.Number,
      }),
      placeholder: item.placeholder,
      error,
    });

    if (item.type === ConnectorConfigFormItemType.Text) {
      return (
        <TextInput
          {...buildCommonProperties()}
          // TODO: update connectors form config and remove RegExp check
          isConfidential={item.isConfidential ?? /(Key|Secret)$/.test(item.key)}
        />
      );
    }

    if (item.type === ConnectorConfigFormItemType.MultilineText) {
      return <Textarea rows={5} {...buildCommonProperties()} />;
    }

    if (item.type === ConnectorConfigFormItemType.Number) {
      return <TextInput type="number" {...buildCommonProperties()} />;
    }

    return (
      <Controller
        name={`formConfig.${item.key}`}
        control={control}
        rules={{
          // For switch, "false" will be treated as an empty value, so we need to set required to false.
          required: item.type === ConnectorConfigFormItemType.Switch ? false : item.required,
          validate:
            item.type === ConnectorConfigFormItemType.Json
              ? (value) =>
                  (typeof value === 'string' && jsonValidator(value)) ||
                  t('errors.invalid_json_format')
              : undefined,
        }}
        render={({ field: { onChange, value } }) => {
          if (item.type === ConnectorConfigFormItemType.Switch) {
            return (
              <Switch
                label={item.label}
                checked={typeof value === 'boolean' ? value : false}
                onChange={({ currentTarget: { checked } }) => {
                  onChange(checked);
                }}
              />
            );
          }

          if (item.type === ConnectorConfigFormItemType.Select) {
            return (
              <Select
                options={item.selectItems}
                value={typeof value === 'string' ? value : undefined}
                error={error}
                onChange={onChange}
              />
            );
          }

          if (item.type === ConnectorConfigFormItemType.Json) {
            return (
              <CodeEditor
                language="json"
                error={error}
                value={typeof value === 'string' ? value : '{}'}
                onChange={onChange}
              />
            );
          }

          // Default (unknown) type is "Text"
          // This will happen when connector's version is ahead of AC
          return (
            <TextInput
              error={error}
              value={typeof value === 'string' ? value : ''}
              onChange={onChange}
            />
          );
        }}
      />
    );
  };

  return (
    <>
      {filteredFormItems.map((item) => (
        <FormField
          key={item.key}
          isRequired={item.required}
          // Tooltip is currently string and does not support i18n.
          tip={item.tooltip}
          title={
            <DangerousRaw>
              {item.type !== ConnectorConfigFormItemType.Switch && item.label}
            </DangerousRaw>
          }
        >
          {renderFormItem(item)}
          {Boolean(item.description) && (
            <div className={styles.description}>{item.description}</div>
          )}
        </FormField>
      ))}
    </>
  );
}

export default ConfigFormFields;
