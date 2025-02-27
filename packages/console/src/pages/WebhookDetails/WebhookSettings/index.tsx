import { type Hook } from '@logto/schemas';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import DetailsForm from '@/components/DetailsForm';
import FormCard from '@/components/FormCard';
import UnsavedChangesAlertModal from '@/components/UnsavedChangesAlertModal';
import useApi from '@/hooks/use-api';
import BasicWebhookForm from '@/pages/Webhooks/components/BasicWebhookForm';
import { trySubmitSafe } from '@/utils/form';

import { type WebhookDetailsFormType, type WebhookDetailsOutletContext } from '../types';
import { webhookDetailsParser } from '../utils';

import CustomHeaderField from './components/CustomHeaderField';
import SigningKeyField from './components/SigningKeyField';
import TestWebhook from './components/TestWebhook';

function WebhookSettings() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { hook, isDeleting, onHookUpdated } = useOutletContext<WebhookDetailsOutletContext>();
  const webhookFormData = webhookDetailsParser.toLocalForm(hook);
  const formMethods = useForm<WebhookDetailsFormType>({
    defaultValues: webhookFormData,
  });
  const api = useApi();

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = formMethods;

  const onSubmit = handleSubmit(
    trySubmitSafe(async (formData) => {
      const updatedHook = await api
        .patch(`api/hooks/${hook.id}`, { json: webhookDetailsParser.toRemoteModel(formData) })
        .json<Hook>();
      reset(webhookDetailsParser.toLocalForm(updatedHook));
      onHookUpdated(updatedHook);
      toast.success(t('general.saved'));
    })
  );

  return (
    <>
      <DetailsForm
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        onDiscard={reset}
      >
        <FormProvider {...formMethods}>
          <FormCard
            title="webhook_details.settings.settings"
            description="webhook_details.settings.settings_description"
          >
            <BasicWebhookForm />
            <SigningKeyField
              hookId={hook.id}
              signingKey={hook.signingKey}
              onSigningKeyUpdated={(signingKey) => {
                onHookUpdated({ ...hook, signingKey });
              }}
            />
            <CustomHeaderField />
          </FormCard>
          <FormCard title="webhook_details.settings.test">
            <TestWebhook hookId={hook.id} />
          </FormCard>
        </FormProvider>
      </DetailsForm>
      <UnsavedChangesAlertModal hasUnsavedChanges={!isDeleting && isDirty} />
    </>
  );
}

export default WebhookSettings;
