import { TabsProps, Tabs } from "antd";
import { MyCards } from "./myCard";
import { PostedCards } from "./postCard";

export const UserCardPage = () => {


    const onChange = (key: string) => {
      console.log(key);
    };
    
    const items: TabsProps['items'] = [
      {
        key: '1',
        label: 'Card List',
        children: <PostedCards />
      },
      {
        key: '2',
        label: 'My Cards',
        children: <MyCards />,
      },
    ];
  return (
    <div className="p-2">
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </div>
  );
};
