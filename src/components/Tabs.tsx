import type { ComponentProps, ReactNode } from "react";
import { Tabs as _Tabs } from "@base-ui/react/tabs";
import Button from "@/components/Button";

type ButtonProps = ComponentProps<"button"> & { children: ReactNode };

type Props = {
  tabs: {
    name: ReactNode;
    content: ReactNode;
  }[];
  onChange: ComponentProps<typeof _Tabs.Root>["onValueChange"];
};

const Tabs = ({ tabs, onChange }: Props) => (
  <_Tabs.Root
    defaultValue={0}
    onValueChange={onChange}
    className="flex w-full flex-col items-center gap-8"
  >
    <_Tabs.List className="flex flex-wrap justify-center gap-4" activateOnFocus>
      {tabs.map((tab, index) => (
        <_Tabs.Tab
          key={index}
          value={index}
          render={(props) => <Button {...(props as ButtonProps)} />}
        >
          {tab.name}
        </_Tabs.Tab>
      ))}
    </_Tabs.List>
    {tabs.map((tab, index) => (
      <_Tabs.Panel
        key={index}
        value={index}
        keepMounted
        className="flex w-full flex-col items-center gap-8"
      >
        {tab.content}
      </_Tabs.Panel>
    ))}
  </_Tabs.Root>
);

export default Tabs;
