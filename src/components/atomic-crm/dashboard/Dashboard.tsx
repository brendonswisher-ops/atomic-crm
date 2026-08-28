import { useGetList } from "ra-core";

import type { Contact, ContactNote } from "../types";
import { ActivityByDay } from "./ActivityByDay";
import { DashboardStepper } from "./DashboardStepper";
import { HomeHeader } from "./HomeHeader";
import { HotContacts } from "./HotContacts";
import { PipelineSnapshot } from "./PipelineSnapshot";
import { StaleIntros } from "./StaleIntros";
import { TasksList } from "./TasksList";
import { UpcomingMeetings } from "./UpcomingMeetings";
import { Welcome } from "./Welcome";

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
    return <DashboardStepper step={1} />;
  }

  if (!totalContactNotes) {
    return <DashboardStepper step={2} contactId={dataContact?.[0]?.id} />;
  }

  return (
    <div className="flex flex-col gap-6 mt-1">
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
    </div>
  );
};
