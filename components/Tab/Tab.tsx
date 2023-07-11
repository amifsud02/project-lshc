type Props = {
  tabTitle: string;
  children: React.ReactNode;
};

const Tab: React.FC<Props> = ({ tabTitle, children }) => {
  return <div className="tab-header" data-tab-title={tabTitle}>{ children }</div>;
};

export default Tab;
