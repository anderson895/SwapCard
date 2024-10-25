/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Form, Input, Layout, Menu, message, Modal } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  CreditCardOutlined,
  TransactionOutlined,
} from "@ant-design/icons";
import { CiLogout } from "react-icons/ci";
import { RouterUrl } from "../routes";
import { logoutAdmin, selector } from "../zustand/store/store.provider";
import { FaUsers } from "react-icons/fa";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth, db } from "../db";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import useStore from "../zustand/store/store";

const { Header, Sider, Content } = Layout;

export default function AdminSide() {
  const admin = useStore(selector("admin"));
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      logoutAdmin();
      navigate(RouterUrl.Login);
    } else {
      navigate(key);
    }
  };

  const showEditModal = () => {
    setIsModalVisible(true);
  };

  const handleUpdateAdmin = async (values: {
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found.");

      // Reload user to get the latest email verification status
      await user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser && updatedUser.email !== values.email) {
        // Send a verification email to the new address before updating
        await verifyBeforeUpdateEmail(updatedUser, values.email);
        message.info(
          "A verification email has been sent to the new address. Please verify it before updating."
        );

        // Do not update Firestore or Authentication until the email is verified
        return;
      }

      // Update password if provided
      if (values.currentPassword && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          values.currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // If reauthentication succeeds, update the password
        if (values.newPassword) {
          await updatePassword(user, values.newPassword);
          message.success("Password updated successfully!");
        }
      }

      // Update email in Firestore
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, { email: values.email });

      setIsModalVisible(false);
    } catch (error: any) {
      console.error("Error updating admin credentials:", error);
      message.error(`Failed to update admin credentials: ${error.message}`);
    }
  };

  return (
    <Layout className="min-h-screen w-full">
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <div>Admin Panel</div>
        <Button type="primary" onClick={showEditModal}>
          Edit Email & Password
        </Button>
      </Header>

      <Layout className="w-full">
        <Sider width="15%">
          <Menu
            theme="dark"
            mode="inline"
            onClick={handleMenuClick}
            items={[
              {
                label: "Home",
                key: RouterUrl.AdminHome,
                icon: <HomeOutlined />,
              },
              {
                label: "Cards",
                key: RouterUrl.AdminCard,
                icon: <CreditCardOutlined />,
              },
              {
                label: "Transactions",
                key: RouterUrl.AdminTransaction,
                icon: <TransactionOutlined />,
              },
              {
                label: "Users",
                key: RouterUrl.AdminUsersManage,
                icon: <FaUsers />,
              },
              { label: "Log out", key: "logout", icon: <CiLogout /> },
            ]}
          />
        </Sider>
        <Content style={{ padding: "24px" }}>
          <Outlet />
        </Content>
      </Layout>
      <Modal
        title="Edit Admin Email & Password"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateAdmin}
          initialValues={{
            email: admin.info.email,
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please enter a valid email",
                type: "email",
              },
              { type: "email", message: "The input is not a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="New Password" name="newPassword">
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
