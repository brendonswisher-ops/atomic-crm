import { useState } from "react";
import {
  RecordRepresentation,
  useRecordContext,
  useTranslate,
  WithRecord,
} from "ra-core";
import { ArrayField } from "@/components/admin/array-field";
import { DateField } from "@/components/admin/date-field";
import { SingleFieldList } from "@/components/admin/single-field-list";
import { TextField } from "@/components/admin/text-field";
import { EmailField } from "@/components/admin/email-field";
import { ReferenceField } from "@/components/admin/reference-field";
import {
  Building2,
  Cake,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Check,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  contactGender,
  contactLeadSources,
  contactLevels,
  formatContactAddress,
  translateContactGenderLabel,
  translateContactQepLabel,
  translatePersonalInfoTypeLabel,
} from "./contactModel";
import type { Contact } from "../types";

export const ContactPersonalInfo = () => {
  const record = useRecordContext<Contact>();
  const translate = useTranslate();

  if (!record) return null;

  const mailing = formatContactAddress(
    record.mailing_street,
    record.mailing_city,
    record.mailing_state,
    record.mailing_zip,
    record.mailing_country,
  );
  const otherAddress = formatContactAddress(
    record.other_street,
    record.other_city,
    record.other_state,
    record.other_zip,
    record.other_country,
  );
  const leadSource =
    contactLeadSources.find((source) => source.id === record.lead_source)
      ?.name || record.lead_source;
  const level =
    contactLevels.find((item) => item.id === record.level)?.name ||
    record.level;

  return (
    <div>
      <ArrayField source="email_jsonb">
        <SingleFieldList className="flex-col gap-y-0">
          <EmailRow />
        </SingleFieldList>
      </ArrayField>

      {record.has_newsletter && (
        <p className="pl-6 py-1 text-sm text-muted-foreground">
          {translate("resources.contacts.fields.has_newsletter")}
        </p>
      )}

      {record.linkedin_url && (
        <PersonalInfoRow
          icon={<Linkedin className="w-4 h-4 text-muted-foreground" />}
          primary={
            <a
              className="underline hover:no-underline text-sm text-muted-foreground"
              href={record.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              title={record.linkedin_url}
            >
              LinkedIn
            </a>
          }
        />
      )}
      <ArrayField source="phone_jsonb">
        <SingleFieldList className="flex-col gap-y-0">
          <PersonalInfoRow
            icon={<Phone className="w-4 h-4 text-muted-foreground" />}
            primary={<TextField source="number" />}
            showType
          />
        </SingleFieldList>
      </ArrayField>
      {record.department && (
        <PersonalInfoRow
          icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
          primary={<span>{record.department}</span>}
        />
      )}
      {record.reports_to != null && (
        <PersonalInfoRow
          icon={<User className="w-4 h-4 text-muted-foreground" />}
          primary={
            <span className="flex flex-wrap gap-x-1">
              <span className="text-muted-foreground">Reports to</span>
              <ReferenceField
                source="reports_to"
                reference="contacts"
                link="show"
              >
                <RecordRepresentation />
              </ReferenceField>
            </span>
          }
        />
      )}
      {mailing && (
        <PersonalInfoRow
          icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
          primary={<span className="whitespace-pre-line">{mailing}</span>}
        />
      )}
      {otherAddress && (
        <PersonalInfoRow
          icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
          primary={
            <span className="whitespace-pre-line">
              <span className="text-muted-foreground">Other: </span>
              {otherAddress}
            </span>
          }
        />
      )}
      {(record.assistant || record.assistant_phone) && (
        <PersonalInfoRow
          icon={<User className="w-4 h-4 text-muted-foreground" />}
          primary={
            <span>
              {record.assistant}
              {record.assistant && record.assistant_phone ? ", " : ""}
              {record.assistant_phone}
            </span>
          }
        />
      )}
      {record.birthdate && (
        <PersonalInfoRow
          icon={<Cake className="w-4 h-4 text-muted-foreground" />}
          primary={<DateField source="birthdate" />}
        />
      )}
      {record.languages && (
        <PersonalInfoRow
          icon={<Languages className="w-4 h-4 text-muted-foreground" />}
          primary={<span>{record.languages}</span>}
        />
      )}
      {leadSource && (
        <PersonalInfoRow
          icon={null}
          primary={
            <span>
              <span className="text-muted-foreground">Lead source </span>
              {leadSource}
            </span>
          }
        />
      )}
      {level && (
        <PersonalInfoRow
          icon={null}
          primary={
            <span>
              <span className="text-muted-foreground">Level </span>
              {level}
            </span>
          }
        />
      )}
      <PersonalInfoRow
        icon={null}
        primary={
          <span>
            <span className="text-muted-foreground">
              {translate("resources.contacts.fields.qep_status", { _: "QEP" })}{" "}
            </span>
            {translateContactQepLabel(record.qep_status, translate)}
          </span>
        }
      />
      {contactGender
        .map((genderOption) => {
          if (record.gender === genderOption.value) {
            return (
              <PersonalInfoRow
                key={genderOption.value}
                icon={
                  <genderOption.icon className="w-4 h-4 text-muted-foreground" />
                }
                primary={
                  <div>
                    {translateContactGenderLabel(genderOption, translate)}
                  </div>
                }
              />
            );
          }
          return null;
        })
        .filter(Boolean)}
    </div>
  );
};

const EmailRow = () => {
  const record = useRecordContext<{ email: string }>();
  const translate = useTranslate();
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(record.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <PersonalInfoRow
      icon={
        <button
          type="button"
          onClick={handleCopy}
          title={translate("crm.common.copy")}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
        </button>
      }
      primary={<EmailField source="email" />}
    />
  );
};

const PersonalInfoRow = ({
  icon,
  primary,
  showType,
}: {
  icon: ReactNode;
  primary: ReactNode;
  showType?: boolean;
}) => {
  const translate = useTranslate();

  return (
    <div className="flex flex-row items-start gap-x-2 py-1 min-h-6">
      <span className="mt-0.5 w-4 shrink-0">{icon}</span>
      <div className="flex flex-wrap gap-x-2 gap-y-0 text-sm">
        {primary}
        {showType ? (
          <WithRecord
            render={(row) =>
              row.type !== "Other" && (
                <span className="text-muted-foreground">
                  {translatePersonalInfoTypeLabel(row.type, translate)}
                </span>
              )
            }
          />
        ) : null}
      </div>
    </div>
  );
};
