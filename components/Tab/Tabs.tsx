'use client'

import Link from "next/link";
import React, { ReactElement, useState } from "react";
import TabTitle from "./TabTitle";
import styles from './tab.module.css';
import crypto from 'crypto';

type Props = {
  children: ReactElement[];
  redirect: string;
  showall: boolean;
};

const Tabs: React.FC<Props> = ({ children, redirect, showall }) => {
  const [selectedTab, setSelectedTab] = useState(0);
    
  return (
    <>
      <div className="tabs__wrapper">
        <ul className={styles.nav__tab}>
          <div className="category">
            {children.map((item, index) => (
              <TabTitle
                key={crypto.randomBytes(20).toString('hex')}
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