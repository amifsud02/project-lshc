'use client'

import Link from "next/link";
import React, { ReactElement, useState } from "react";
import TabTitle from "./TabTitle";

type Props = {
  children: ReactElement[];
  redirect: string;
  showall: boolean;
};

const Tabs: React.FC<Props> = ({ children, redirect, showall }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Log the titles of the Tab components
  console.log(children.map((item) => item.props['data-tab-title']));
  
  return (
    <>
      <div className="tabs__wrapper">
        <ul className="nav__tab">
          <div className="category">
            {children.map((item, index) => (
              <TabTitle
                key={index}
                title={item.props['data-tab-title']}
                index={index}
                setSelectedTab={setSelectedTab}
                isActive={selectedTab === index}
              />
            ))}
          </div>

          {showall ? <Link href={redirect} className="show-all">Show All</Link> : null}
        </ul>
      </div>

      <div>
        {children[selectedTab]}
      </div>
    </>
  );
};

export default Tabs;