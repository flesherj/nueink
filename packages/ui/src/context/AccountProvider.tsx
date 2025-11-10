import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from 'react';
import { AccountEntity } from '@nueink/aws';

export type AccountProviderContextProps = {
  account?: AccountEntity;
};

export const AccountContext = createContext<AccountProviderContextProps>({
  account: undefined,
});

export type AccountProviderProps = {
  children?: ReactNode;
} & AccountProviderContextProps;

export const AccountProvider = (props: AccountProviderProps) => {
  const [account, setAccount] = useState<AccountEntity | undefined>(
    props.account
  );
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
