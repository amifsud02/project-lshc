import React from "react";

type Props = {
  title: string;
  index: number;
  isActive: boolean;
  setSelectedTab: (index: number) => void;
};

const TabTitle: React.FC<Props> = ({ title, setSelectedTab, index, isActive }) => {
  return (
    <button className={isActive ? "tablinks active" : 'tablinks'} onClick={() => setSelectedTab(index)}>{title}</button>
  );
};

export default TabTitle;
