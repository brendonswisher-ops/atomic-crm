import {
  DragDropContext,
  Draggable,
  Droppable,
  type OnDragEndResponder,
} from "@hello-pangea/dnd";
import { useListContext, useRedirect, useUpdate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Contact } from "../types";

export const ContactKanban = () => {
  const { noteStatuses } = useConfigurationContext();
  const { data: contacts, isPending } = useListContext<Contact>();
  const [update] = useUpdate<Contact>();

  if (isPending) return null;

  const contactsByStatus = (noteStatuses ?? []).reduce(
    (acc, status) => {
      acc[status.value] = (contacts ?? []).filter(
        (contact) => contact.status === status.value,
      );
      return acc;
    },
    {} as Record<string, Contact[]>,
  );

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const contact = (contacts ?? []).find(
      (item) => String(item.id) === String(draggableId),
    );
    if (!contact) return;

    update("contacts", {
      id: contact.id,
      data: { status: destination.droppableId },
      previousData: contact,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(noteStatuses ?? []).map((status) => (
          <ContactKanbanColumn
            key={status.value}
            status={status.value}
            label={status.label}
            contacts={contactsByStatus[status.value] ?? []}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

const ContactKanbanColumn = ({
  status,
  label,
  contacts,
}: {
  status: string;
  label: string;
  contacts: Contact[];
}) => (
  <div className="flex-1 min-w-48 pb-4">
    <div className="flex flex-col items-center">
      <h3 className="text-base font-medium">{label}</h3>
      <p className="text-sm text-muted-foreground">{contacts.length}</p>
    </div>
    <Droppable droppableId={status}>
      {(droppableProvided, snapshot) => (
        <div
          ref={droppableProvided.innerRef}
          {...droppableProvided.droppableProps}
          className={`flex flex-col rounded-2xl mt-2 gap-2 min-h-24 ${
            snapshot.isDraggingOver ? "bg-muted" : ""
          }`}
        >
          {contacts.map((contact, index) => (
            <ContactKanbanCard
              key={contact.id}
              contact={contact}
              index={index}
            />
          ))}
          {droppableProvided.placeholder}
        </div>
      )}
    </Droppable>
  </div>
);

const ContactKanbanCard = ({
  contact,
  index,
}: {
  contact: Contact;
  index: number;
}) => {
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(`/contacts/${contact.id}/show`);
  };

  return (
    <Draggable draggableId={String(contact.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className="cursor-pointer"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          onClick={handleClick}
        >
          <Card
            className={`py-3 transition-all duration-200 ${
              snapshot.isDragging
                ? "opacity-90 transform rotate-1 shadow-lg"
                : "shadow-sm hover:shadow-md"
            }`}
          >
            <CardContent className="px-3 flex flex-col gap-1">
              <p className="text-sm font-medium">
                {`${contact.first_name} ${contact.last_name ?? ""}`}
              </p>
              {contact.company_name ? (
                <p className="text-xs text-muted-foreground">
                  {contact.company_name}
                </p>
              ) : null}
              {contact.title ? (
                <p className="text-xs text-muted-foreground">{contact.title}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};
