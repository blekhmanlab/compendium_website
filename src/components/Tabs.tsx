import type { ComponentProps, ReactNode } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import Button from "@/components/Button";
import classes from "./Tabs.module.css";

type Props = {
  tabs: {
    name: ReactNode;
    content: ReactNode;
  }[];
  onChange: ComponentProps<typeof TabGroup>["onChange"];
};

const Tabs = ({ tabs, onChange }: Props) => (
  <TabGroup onChange={onChange} className="sub-section">
    {() => (
      <div className="sub-section">
        <TabList className={classes.tabs}>
          {tabs.map((tab, index) => (
            <Tab key={index} as={Button}>
              {tab.name}
            </Tab>
          ))}
        </TabList>
        <TabPanels className={classes.panels}>
          {tabs.map((tab, index) => (
            <TabPanel key={index} className="sub-section" unmount={false}>
              {tab.content}
            </TabPanel>
          ))}
        </TabPanels>
      </div>
    )}
  </TabGroup>
);

export default Tabs;
