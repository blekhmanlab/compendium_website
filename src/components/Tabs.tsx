import type { ComponentProps, ReactNode } from "react";
import { Fragment } from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import Button from "@/components/Button";

type Props = {
  tabs: {
    name: ReactNode;
    content: ReactNode;
  }[];
  onChange: ComponentProps<typeof TabGroup>["onChange"];
};

const Tabs = ({ tabs, onChange }: Props) => (
  <TabGroup onChange={onChange} as={Fragment}>
    {() => (
      <div className="flex w-full flex-col items-center gap-8">
        <TabList className="flex flex-wrap justify-center gap-4">
          {tabs.map((tab, index) => (
            <Tab key={index} as={Button}>
              {tab.name}
            </Tab>
          ))}
        </TabList>
        <TabPanels as={Fragment}>
          {tabs.map((tab, index) => (
            <TabPanel
              key={index}
              unmount={false}
              className="flex w-full flex-col items-center gap-8"
            >
              {tab.content}
            </TabPanel>
          ))}
        </TabPanels>
      </div>
    )}
  </TabGroup>
);

export default Tabs;
