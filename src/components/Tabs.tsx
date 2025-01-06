import { ReactNode, type ComponentProps } from "react";
import { Tab } from "@headlessui/react";
import Button from "@/components/Button";
import classes from "./Tabs.module.css";

type Props = {
  tabs: {
    name: ReactNode;
    description: ReactNode;
    content: ReactNode;
  }[];
  onChange: ComponentProps<typeof Tab.Group>["onChange"];
};

const Tabs = ({ tabs, onChange }: Props) => (
  <Tab.Group onChange={onChange}>
    {({ selectedIndex }) => (
      <div className="sub-section">
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
            <Tab.Panel key={index} className="sub-section" unmount={false}>
              {tab.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </div>
    )}
  </Tab.Group>
);

export default Tabs;
