import React from 'react';
import { Collapse, Tabs, List } from 'antd';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { TabPane } = Tabs;

const faqData = [
    {
      question: 'How do I create an account?',
      answer: 'To create an account, you will need an active Facebook profile and a UAE phone number. After providing these details, your account will be reviewed by the site administrator for approval.',
    },
    {
      question: 'How do I post a swap?',
      answer: 'To post a swap, click the "Post Swap" button on your dashboard. Enter the details of the card you want to swap, upload a photo, and activate the post. Your swap will be visible to other users for up to 7 days.',
    },
    {
      question: 'How do I accept a swap request?',
      answer: `To accept a swap request, navigate to your swap post and review the request from another user. If you're satisfied, click 'Accept.' If not, you can decline the request and wait for another user to respond.`,
    },
    {
      question: 'What happens if my swap request is declined?',
      answer: 'If your swap request is declined, the swap post will stay active, allowing other users to respond. You can also modify your offer and submit it again',
    },
    {
      question: 'How can I view my swap history?',
      answer: 'You can view your swap history, including both successful and failed swaps, on your summary page. It displays the date, card details, and the status of each swap.',
    },
    {
      question: 'How do I receive notifications?',
      answer: 'You will receive notifications about your swap posts, such as new requests or status changes, at your registered email address. Be sure to keep your email up to date in your profile settings.',
    },
    {
      question: 'How can I rate and review another user?',
      answer: 'Once a swap is completed, you’ll have the option to rate and review the other user based on your experience. The ratings and reviews will be visible on the user’s profile.',
    },
    {
      question: 'How can I contact customer support?',
      answer: 'If you need assistance, you can reach our customer support team through the contact options listed in the "Customer Support" section of the Help page.',
    },
  ];
  
  const tutorialData = [
    {
      title: 'How to Post a Swap',
      description: `navigate to the "Post Swap" button on your dashboard. You will need to provide detailed information about the card you want to swap, including the player's name, card type, year of manufacture, and any special features. Next, upload a high-quality image of the card. Ensure the image is clear and accurately represents the card to attract potential swap partners. Finally, review your swap post and activate it. Keep in mind that your swap post will only be visible for 7 days, so watch for any incoming requests.`,
    },
    {
      title: 'Managing Your Swap Posts',
      description: `Managing your swap posts is easy with our platform. Head to your dashboard to view a list of your active swap posts. To make changes, click the "Edit" button, where you can update the card description, photo, or swap terms. If you want to remove a post before it expires, just click the "Delete" button. You can also monitor all active swap posts for incoming requests and check the status of each request by clicking on the respective post.`,
    },
    {
      title: 'How to Accept or Decline a Swap Request',
      description: `When another user sends a swap request for one of your posts, you'll receive a notification via email and on your dashboard. To respond, go to your swap post and review the offer. Consider the card being offered and any additional terms suggested by the other user. If you’re satisfied with the offer, click "Accept." The swap post will then be marked as "closed," and you can proceed to finalize the swap with the other user. If you prefer to decline the request, click "Decline." Your post will remain active, allowing other users to submit new requests.`,
    },
    {
      title: 'Advanced Search Techniques for Swap Posts',
      description: `Our platform provides powerful search tools to help you find the perfect swap post. Use the search bar on the homepage or swap post page to filter results by card type, player name, collection, or other relevant criteria. You can also sort the results by posting date or alphabetically by player name. For more precise results, take advantage of the advanced search filters to narrow down posts by specific features such as rarity, year, or team affiliation. These tools will help you quickly find the cards you're most interested in swapping for.`,
    },
    {
      title: 'Rating and Reviewing Other Users',
      description: `After completing a swap, it's important to provide feedback on your experience. To rate and review another user, go to the completed swap post and click the "Rate User" button. You'll be prompted to give a star rating out of 5 and leave a brief comment about the transaction. Be honest and constructive in your feedback, as this helps foster trust within the community. Your rating and review will be visible on the other user's profile and can influence their reputation on the platform.`,
    },
  ];

export const HelpSection: React.FC = () => {
  return (
    <div className=" mx-2 md:mx-4 py-8 ">
      <Tabs defaultActiveKey="1">
        <TabPane tab="FAQs" key="1">
          <Collapse accordion>
            {faqData.map((faq, index) => (
              <Panel header={<p className='text-white'>{faq.question}</p>} key={index}>
                <p>{faq.answer}</p>
              </Panel>
            ))}
          </Collapse>
        </TabPane>
        <TabPane tab="Tutorials" key="2">
          <List
            itemLayout="vertical"
            dataSource={tutorialData}
            className='bg-[#13161b] text-white rounded-md p-2 md:p-4'
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={<h2 className='text-white'>{item.title}</h2>}
                  description={<p className='text-white bg-[#1c1f25] p-2'>{item.description}</p>}
                />
              </List.Item>
            )}
          />
        </TabPane>
        <TabPane tab="Customer Support" key="3">
            <div className='bg-[#13161b] text-white rounded-md px-4 py-4'>
            <div className="text-lg mb-4 ">Contact Us</div>
          <div className="space-y-4">
            <div className="flex items-center">
              <PhoneOutlined className="mr-2" />
              <span>+971-55-2046976</span>
            </div>
            <div className="flex items-center">
              <MailOutlined className="mr-2" />
              <span>swapmycard@gmail.com</span>
            </div>
          </div>
            </div>

        </TabPane>
      </Tabs>
    </div>
  );
};

