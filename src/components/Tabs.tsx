import { ReactNode } from "react";
import { Tab } from "@headlessui/react";
import Button from "@/components/Button";
import classes from "./Tabs.module.css";

type Props = {
  tabs: {
    name: ReactNode;
    description: ReactNode;
    content: ReactNode;
  }[];
};

const Tabs = ({ tabs }: Props) => (
  <Tab.Group>
    {({ selectedIndex }) => (
      <div className="content">
        <Tab.List className={classes.tabs}>
          {tabs.map((tab, index) => (
            <Tab key={index} as={Button}>
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <p>{tabs[selectedIndex].description}</p>
        <Tab.Panels className={classes.panels}>
          {tabs.map((tab, index) => (
            <Tab.Panel key={index} className="content">
              {tab.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </div>
    )}
  </Tab.Group>
);

export default Tabs;
