import { useGetList } from "ra-core";

import type { Contact, ContactNote } from "../types";
import { ActivityByDay } from "./ActivityByDay";
import { AlpsBackdrop } from "./AlpsBackdrop";
import { DashboardStepper } from "./DashboardStepper";
import { HomeHeader } from "./HomeHeader";
import { HotContacts } from "./HotContacts";
import { PipelineSnapshot } from "./PipelineSnapshot";
import { StaleIntros } from "./StaleIntros";
import { TasksList } from "./TasksList";
import { UpcomingMeetings } from "./UpcomingMeetings";
import { Welcome } from "./Welcome";

const DashboardShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <AlpsBackdrop />
    <div className="relative z-[1] flex flex-col gap-6 mt-1 pb-10">
      {children}
    </div>
  </>
);

export const Dashboard = () => {
  const {
    data: dataContact,
    total: totalContact,
    isPending: isPendingContact,
  } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });

  const { total: totalContactNotes, isPending: isPendingContactNotes } =
    useGetList<ContactNote>("contact_notes", {
      pagination: { page: 1, perPage: 1 },
    });

  const isPending = isPendingContact || isPendingContactNotes;

  if (isPending) {
    return null;
  }

  if (!totalContact) {
    return (
      <DashboardShell>
        <DashboardStepper step={1} />
      </DashboardShell>
    );
  }

  if (!totalContactNotes) {
    return (
      <DashboardShell>
        <DashboardStepper step={2} contactId={dataContact?.[0]?.id} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {import.meta.env.VITE_IS_DEMO === "true" ? <Welcome /> : null}
      <HomeHeader />
      <PipelineSnapshot />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HotContacts />
        <StaleIntros />
        <UpcomingMeetings />
        <TasksList />
      </div>
      <ActivityByDay />
    </DashboardShell>
  );
};
