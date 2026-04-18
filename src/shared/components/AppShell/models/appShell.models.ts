import type { ReactNode } from 'react';

import { APP_VIEWS } from '../constants/appShell.constants';

// View type derived from APP_VIEWS constant to keep literals centralized
export type View = typeof APP_VIEWS[number] | (string & {}); // allow extensibility while keeping common literal union

export interface AppShellProps {
  currentView: View;
  onNavigate: (view: View) => void;
  children: ReactNode;
}
