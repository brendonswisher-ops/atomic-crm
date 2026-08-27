import {
  email,
  required,
  useRecordContext,
  useTranslate,
  useUpdate,
  useNotify,
} from "ra-core";
import type { FocusEvent, ClipboardEventHandler } from "react";
import { useFormContext } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { RadioButtonGroupInput } from "@/components/admin/radio-button-group-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";

import { isLinkedinUrl } from "../misc/isLinkedInUrl";
import { StatusSelector } from "../notes";
import type { Sale, Contact } from "../types";
import { Avatar } from "./Avatar";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";
import {
  contactGender,
  contactLeadSources,
  contactLevels,
  translateContactGenderLabel,
  translatePersonalInfoTypeLabel,
} from "./contactModel.ts";

export const ContactInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-2 p-1 relative md:static">
      <div className="absolute top-0 right-1 md:static">
        <Avatar />
      </div>
      <div className="flex gap-10 md:gap-6 flex-col md:flex-row">
        <div className="flex flex-col gap-10 flex-1">
          <ContactIdentityInputs />
          <ContactPositionInputs />
        </div>
        {isMobile ? null : (
          <Separator orientation="vertical" className="flex-shrink-0" />
        )}
        <div className="flex flex-col gap-10 flex-1">
          <ContactPersonalInformationInputs />
          <ContactMiscInputs />
        </div>
      </div>
    </div>
  );
};

const ContactIdentityInputs = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.identity")}
      </h6>
      <RadioButtonGroupInput
        label={false}
        row
        source="gender"
        choices={contactGender}
        helperText={false}
        optionText={(choice) => translateContactGenderLabel(choice, translate)}
        translateChoice={false}
        optionValue="value"
        defaultValue={contactGender[0].value}
      />
      <TextInput source="first_name" validate={required()} helperText={false} />
      <TextInput source="last_name" validate={required()} helperText={false} />
    </div>
  );
};

const contactOptionText = (choice: Contact) =>
  choice ? `${choice.first_name} ${choice.last_name}` : "";

const ContactPositionInputs = () => {
  const translate = useTranslate();
  const record = useRecordContext<Contact>();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.position")}
      </h6>
      <TextInput source="title" helperText={false} />
      <TextInput
        source="department"
        label={translate("resources.contacts.fields.department", {
          _: "Department",
        })}
        helperText={false}
      />
      <ReferenceInput source="company_id" reference="companies" perPage={10}>
        <AutocompleteCompanyInput label="resources.contacts.fields.company_id" />
      </ReferenceInput>
      <ReferenceInput
        source="reports_to"
        reference="contacts"
        perPage={10}
        filter={record?.id ? { "id@neq": record.id } : undefined}
      >
        <AutocompleteInput
          optionText={contactOptionText}
          helperText={false}
          label={translate("resources.contacts.fields.reports_to", {
            _: "Reports To",
          })}
        />
      </ReferenceInput>
    </div>
  );
};

const ContactPersonalInformationInputs = () => {
  const translate = useTranslate();
  const { getValues, setValue } = useFormContext();
  const emailTypes = [
    {
      id: "Work",
      name: translatePersonalInfoTypeLabel("Work", translate),
    },
    {
      id: "Home",
      name: translatePersonalInfoTypeLabel("Home", translate),
    },
    {
      id: "Other",
      name: translatePersonalInfoTypeLabel("Other", translate),
    },
  ];
  const phoneTypes = [
    {
      id: "Work",
      name: translatePersonalInfoTypeLabel("Work", translate),
    },
    {
      id: "Mobile",
      name: translatePersonalInfoTypeLabel("Mobile", translate),
    },
    {
      id: "Home",
      name: translatePersonalInfoTypeLabel("Home", translate),
    },
    {
      id: "Fax",
      name: translatePersonalInfoTypeLabel("Fax", translate),
    },
    {
      id: "Other",
      name: translatePersonalInfoTypeLabel("Other", translate),
    },
  ];

  // set first and last name based on email
  const handleEmailChange = (email: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !email) return;
    const [first, last] = email.split("@")[0].split(".");
    setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
    setValue(
      "last_name",
      last ? last.charAt(0).toUpperCase() + last.slice(1) : "",
    );
  };

  const handleEmailPaste: ClipboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (e) => {
    const email = e.clipboardData?.getData("text/plain");
    handleEmailChange(email);
  };

  const handleEmailBlur = (
    e: FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const email = e.target.value;
    handleEmailChange(email);
  };

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.personal_info")}
      </h6>
      <ArrayInput source="email_jsonb" helperText={false}>
        <SimpleFormIterator
          inline
          disableReordering
          disableClear
          className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
        >
          <TextInput
            source="email"
            className="w-full"
            helperText={false}
            label={false}
            placeholder={translate("resources.contacts.fields.email")}
            validate={email()}
            onPaste={handleEmailPaste}
            onBlur={handleEmailBlur}
          />
          <SelectInput
            source="type"
            helperText={false}
            label={false}
            optionText="name"
            choices={emailTypes}
            defaultValue="Work"
            className="w-24 min-w-24"
          />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="phone_jsonb" helperText={false}>
        <SimpleFormIterator
          inline
          disableReordering
          disableClear
          className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
        >
          <TextInput
            source="number"
            className="w-full"
            helperText={false}
            label={false}
            placeholder={translate("resources.contacts.fields.phone_number")}
          />
          <SelectInput
            source="type"
            helperText={false}
            label={false}
            optionText="name"
            choices={phoneTypes}
            defaultValue="Work"
            className="w-28 min-w-28"
          />
        </SimpleFormIterator>
      </ArrayInput>
      <TextInput
        source="linkedin_url"
        helperText={false}
        validate={isLinkedinUrl}
      />
      <TextInput
        source="mailing_street"
        label={translate("resources.contacts.fields.mailing_street", {
          _: "Mailing Street",
        })}
        helperText={false}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          source="mailing_city"
          label={translate("resources.contacts.fields.mailing_city", {
            _: "Mailing City",
          })}
          helperText={false}
        />
        <TextInput
          source="mailing_state"
          label={translate("resources.contacts.fields.mailing_state", {
            _: "Mailing State/Province",
          })}
          helperText={false}
        />
        <TextInput
          source="mailing_zip"
          label={translate("resources.contacts.fields.mailing_zip", {
            _: "Mailing Zip/Postal Code",
          })}
          helperText={false}
        />
        <TextInput
          source="mailing_country"
          label={translate("resources.contacts.fields.mailing_country", {
            _: "Mailing Country",
          })}
          helperText={false}
        />
      </div>
      <TextInput
        source="other_street"
        label={translate("resources.contacts.fields.other_street", {
          _: "Other Street",
        })}
        helperText={false}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          source="other_city"
          label={translate("resources.contacts.fields.other_city", {
            _: "Other City",
          })}
          helperText={false}
        />
        <TextInput
          source="other_state"
          label={translate("resources.contacts.fields.other_state", {
            _: "Other State/Province",
          })}
          helperText={false}
        />
        <TextInput
          source="other_zip"
          label={translate("resources.contacts.fields.other_zip", {
            _: "Other Zip/Postal Code",
          })}
          helperText={false}
        />
        <TextInput
          source="other_country"
          label={translate("resources.contacts.fields.other_country", {
            _: "Other Country",
          })}
          helperText={false}
        />
      </div>
      <TextInput
        source="assistant"
        label={translate("resources.contacts.fields.assistant", {
          _: "Assistant",
        })}
        helperText={false}
      />
      <TextInput
        source="assistant_phone"
        label={translate("resources.contacts.fields.assistant_phone", {
          _: "Asst. Phone",
        })}
        helperText={false}
      />
      <DateInput
        source="birthdate"
        label={translate("resources.contacts.fields.birthdate", {
          _: "Birthdate",
        })}
        helperText={false}
      />
      <TextInput
        source="languages"
        label={translate("resources.contacts.fields.languages", {
          _: "Languages",
        })}
        helperText={false}
      />
    </div>
  );
};

const ContactMiscInputs = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.misc")}
      </h6>
      <TextInput source="background" multiline helperText={false} />
      <BooleanInput source="has_newsletter" helperText={false} />
      <ReferenceInput
        reference="sales"
        source="sales_id"
        sort={{ field: "last_name", order: "ASC" }}
        filter={{
          "disabled@neq": true,
        }}
      >
        <SelectInput
          helperText={false}
          optionText={saleOptionRenderer}
          validate={required()}
        />
      </ReferenceInput>
      <SelectInput
        source="lead_source"
        label={translate("resources.contacts.fields.lead_source", {
          _: "Lead Source",
        })}
        choices={contactLeadSources}
        helperText={false}
        emptyText="None"
      />
      <SelectInput
        source="level"
        label={translate("resources.contacts.fields.level", {
          _: "Level",
        })}
        choices={contactLevels}
        helperText={false}
        emptyText="None"
      />
    </div>
  );
};

const saleOptionRenderer = (choice: Sale) =>
  `${choice.first_name} ${choice.last_name}`;

export const ContactStatusSelector = () => {
  const record = useRecordContext<Contact>();
  const [update] = useUpdate<Contact>();
  const notify = useNotify();
  if (!record) return null;

  const handleStatusChange = (nextStatus: string) => {
    if (nextStatus === record?.status) return;

    update(
      "contacts",
      {
        id: record.id,
        data: { status: nextStatus },
        previousData: record,
      },
      {
        mutationMode: "optimistic",
        onError: (error) => {
          notify(
            typeof error === "string"
              ? error
              : error?.message || "ra.notification.http_error",
            {
              type: "error",
              messageArgs: {
                _: typeof error === "string" ? error : error?.message,
              },
            },
          );
        },
      },
    );
  };

  return (
    <div className="[&_button]:w-auto">
      <StatusSelector
        status={record?.status}
        setStatus={handleStatusChange}
        triggerClassName="w-full"
      />
    </div>
  );
};
