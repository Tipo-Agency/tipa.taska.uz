import React from 'react';
import { TableCollection, Meeting, User, TableCollection as Table } from '../../types';
import MeetingsView from '../MeetingsView';

interface MeetingsModuleProps {
  table: TableCollection;
  meetings: Meeting[];
  users: User[];
  tables: Table[];
  actions: any;
}

export const MeetingsModule: React.FC<MeetingsModuleProps> = ({
  table,
  meetings,
  users,
  tables,
  actions,
}) => {
  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-[#191919]">
      <MeetingsView 
        meetings={meetings} 
        users={users} 
        tableId={table.id} 
        showAll={table.isSystem} 
        tables={tables} 
        onSaveMeeting={actions.saveMeeting} 
        onUpdateSummary={actions.updateMeetingSummary} 
      />
    </div>
  );
};

