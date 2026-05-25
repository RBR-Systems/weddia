import auth from "./auth.json";
import budget from "./budget.json";
import common from "./common.json";
import events from "./events.json";
import guestList from "./guest-list.json";
import multiClient from "./multi-client.json";
import nav from "./nav.json";
import organizations from "./organizations.json";
import schedule from "./schedule.json";
import tableAssignment from "./table-assignment.json";
import tasks from "./tasks.json";
import vendors from "./vendors.json";

export const es = {
  ...auth,
  ...budget,
  ...common,
  ...events,
  ...guestList,
  ...multiClient,
  ...nav,
  ...organizations,
  ...schedule,
  ...tableAssignment,
  ...tasks,
  ...vendors,
};
