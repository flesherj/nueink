import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from 'react';
import { Account } from '@nueink/aws';

export type AccountProviderContextProps = {
  account?: Account;
};

export const AccountContext = createContext<AccountProviderContextProps>({
  account: undefined,
});

export type AccountProviderProps = {
  children?: ReactNode;
} & AccountProviderContextProps;

export const AccountProvider = (props: AccountProviderProps) => {
  const [account, setAccount] = useState<Account | undefined>(props.account);
  useEffect(() => {
    setAccount(props.account);
  }, [props.account]);

  return (
    <AccountContext.Provider value={{ account }}>
      {props.children}
    </AccountContext.Provider>
  );
};

export const useAccountProvider = () => {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error('Must be used within an AccountProvider');
  }

  return context;
};
