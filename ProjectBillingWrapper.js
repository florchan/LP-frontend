import React from 'react';
import { Tabs } from 'antd';
import { FolderOpenOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import MyProjects from '../MyProjects/MyProjects';
import ProfileHeader from '../../subComponents/Header/ProfileHeader';
import Billing from '../Billing/Biling';

const { TabPane } = Tabs;

const ProjectBillingWrapper = () => (
  <>
    <ProfileHeader />
    <Tabs defaultActiveKey="1">
      <TabPane
        key="1"
        tab={(
          <span>
            <FolderOpenOutlined />
            My Projects
          </span>
)}
      >
        <MyProjects />
      </TabPane>

      <TabPane
        key="2"
        tab={(
          <span>
            <ShoppingCartOutlined />
            Invoices
          </span>
)}
      >
        <Billing />
      </TabPane>
    </Tabs>
  </>
);

export default ProjectBillingWrapper;
