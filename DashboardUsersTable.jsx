/* eslint-disable import/order */
/* eslint-disable no-underscore-dangle */
import React, { useState, useEffect } from 'react';
import ProfileHeader from '../../subComponents/Header/ProfileHeader';
import {
  Table, Button,
} from 'antd';
import { useHistory, Link } from 'react-router-dom';
import DashboardUsersModal from '../../subComponents/DashboardUserModal/DashboardUserModal';
import './DashboardUsersTable.less';
import { LeftOutlined, LoadingOutlined } from '@ant-design/icons';

import axios from 'axios';

const DashboardUsersTable = () => {
  const history = useHistory();
  const [users, setUsers] = useState([]);
  const [isModal, setIsModal] = useState(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const getUsers = async () => {
    setLoading(true);
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`);
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    getUsers();
  }, []);

  const columns = [{
    title: 'USERNAME',
    align: 'center',
    dataIndex: 'fullname',
    key: 'fullname',
    render: (data) => <span>{data}</span>,
  }, {
    title: 'EMAIL',
    align: 'center',
    dataIndex: 'email',
    key: 'email',
    render: (data) => <span>{data}</span>,
  }, {
    title: 'OWED AMOUNT',
    align: 'center',
    dataIndex: 'owedAmount',
    key: 'owedAmount',
    render: (data) => (
      <span>
        {Math.round((data / 100) * 100) / 100}
        $
      </span>
    ),
  }, {
    title: 'TOTAL PAID AMOUNT',
    align: 'center',
    dataIndex: 'paidAmount',
    key: 'paidAmount',
    render: (data) => (
      <span>
        {Math.round((data / 100) * 100) / 100}
        $
      </span>
    ),
  }, {
    title: 'OWED',
    align: 'center',
    key: 'owed',
    render: (data, row) => {
      const text = row.paidAmount ? `${((row.owedAmount / (row.paidAmount + row.owedAmount)) * 100).toFixed(2)}%` : 'Not paid yet';
      return <span style={{ whiteSpace: 'nowrap' }}>{text}</span>;
    },
  }, {
    title: 'ACTIONS',
    align: 'center',
    key: 'actions',
    render: (data, row) => (
      <div className="buttons-group">
        <Button type="primary" onClick={() => history.push(`/dashboard/users/${row._id}/projects`)}>
          Projects
        </Button>
        <Button type={!row.is_suspended ? 'danger' : 'primary'} onClick={() => { setSelectedUser(row); setIsModal('suspend'); }}>
          { !row.is_suspended ? 'Suspend user' : 'Unsuspend user' }
        </Button>
        <Button type="danger" onClick={() => { setSelectedUser(row); setIsModal('delete'); }}>
          Delete user
        </Button>
      </div>
    ),
  }];

  const handleChangeTableSize = (current) => {
    setPage(current.current);
    setLimit(current.pageSize);
  };

  return (
    <>
      <ProfileHeader />
      <div className="table-container">
        <div className="table-header">
          <Link to="/myprojects">
            <Button icon={<LeftOutlined />} />
          </Link>
          <h2 className="dashboard-title">Admin Dashboard</h2>
        </div>
        { loading
          ? <LoadingOutlined className="loading" />
          : (
            <Table
              columns={columns}
              dataSource={users}
              onChange={handleChangeTableSize}
              pagination={{
                defaultPageSize: limit,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '30', '50'],
                current: +page,
              }}
              rowKey={(row) => row._id}
            />
          )}
        <DashboardUsersModal
          isModal={isModal}
          setIsModal={setIsModal}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          getUsers={getUsers}
        />
      </div>
    </>
  );
};

export default DashboardUsersTable;
