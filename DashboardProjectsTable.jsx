/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/order */
import React, { useState, useEffect } from 'react';
import ProfileHeader from '../../subComponents/Header/ProfileHeader';
import axios from 'axios';
import Icon, { PauseOutlined, SyncOutlined} from '@ant-design/icons';
import {
  Table, Button, Modal, message, Select,Tooltip,
} from 'antd';
import moment from 'moment';
import './DashboardProjectsTable.less';
import { LeftOutlined, LoadingOutlined,QuestionCircleOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import DashboardProjectsModal from '../../subComponents/DashboardProjectsModal/DashboardProjectsModal';

const options = [
  { value: 'days' },
  { value: 'hours' },
  { value: 'minutes' },
];

const frequencyIcon =(row)=>{
  if (!row.is_active){
    return(
      <PauseOutlined style={{ color: 'rgb(157, 164, 200)', marginLeft: '10px' }}/>
    )
  }
  if(!row.is_finished && !row.is_suspended && row.is_active && row.credentials && row.is_payment_active ||
    row.is_active && row.credentials && row.is_trialing){

    return (
      <SyncOutlined spin style={{ color: 'rgb(157, 164, 200)', marginLeft: '10px' }} />
    )
  } else{
    return(

      <SyncOutlined style={{ color: 'rgb(157, 164, 200)', marginLeft: '10px' }} />
    )
  }
  
}
const showTrial = (curUser,row) => {
  const createdAt = moment(curUser.createdAt);
    const curDate = moment(new Date())
    const trialExpiredAt = createdAt.diff(curDate, 'days') + 3
    if (curUser.is_trial) return `${trialExpiredAt} days left on trial`
    if (!row.plan) return 'Project doesn\'t have a plan'
    return  row.plan === 'now_plan' ? 'Now plan' : 'Later plan'
}

const DashboardProjectsTable = () => {
  const [isModal, setIsModal] = useState(null);
  const [projects, setProjects] = useState([]);
  const [user,setUser] = useState()
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTime, setShowTime] = useState('days');
  const [loading, setLoading] = useState(false);
  const [isPaymentModal, setIsPaymentModal] = useState(null);
  const { id: userId } = useParams();

  const getUser = async () => {
    setLoading(true);
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin/user/${userId}`);
    setProjects(res.data.projects);
    setUser(res.data)
    setLoading(false);
  };

  useEffect(() => {
    getUser();
  }, []);
  const columns = [{
    title: 'PROJECT NAME',
    align: 'center',
    dataIndex: 'display_name',
    key: 'display_name',
    render: (data, row) => {
      let status;
      if (row.is_trialing){
        status = ''
      }
      if (row.is_finished) {
        status = 'Campaing has ended';
      } else if (row.credentials === false) {
        status = 'Has to be reconnected';
      } else if (!row.is_payment_active && !row.is_trialing && row.credentials !== undefined) {
        status = 'Problems with billing';
      } else if (row.credentials === undefined) {
        status = 'Problems with credentials';
      } else if (row.display_name) {
        status = data;
      } else {
        status = 'Pending';
      }

      return (
        <div className="name-field">
          <span>{status}</span>
          <Tooltip style={{whiteSpace:'nowrap'}}title={`The project was checked ${row.total_checked || 0} times and updated ${row.total_adjusted || 0} times`}>

        <QuestionCircleOutlined />
          </Tooltip>
          
        </div>
      );
    },
  }, {
    title: 'LINK',
    align: 'center',
    key: 'link',
    render: (data, row) => (
      <a target="_blank" className="compaing-link" href={`https://anon.ws/?${row.url}`}>
        View Campaign
      </a>
    ),
  }, {
    title: 'PLAN',
    align: 'center',
    dataIndex: 'plan',
    key: 'plan',
    render: (data, row) => (
      <div  className="plan-wrapper">
      <div className="project-icon-div" style={{ whiteSpace: 'nowrap' }}>{showTrial(user,row)}</div>
      {row && frequencyIcon(row)}
      </div>
      )
  }, {
    title: 'TOTAL TIME ACTIVE',
    align: 'center',
    dataIndex: 'total_billing_time',
    key: 'total_billing_time',
    render: (data) => {
      let time = data.$numberDecimal / 1000;
      switch (showTime) {
        case 'minutes':
          time /= 60;
          break;
        case 'hours':
          time /= 3600;
          break;
        case 'days':
          time = time / 3600 / 24;
          break;
        default:
          break;
      }
      time = Math.floor(time);
      return <span>{`${time} ${showTime}`}</span>;
    },
  }, {
    title: 'OWED AMOUNT',
    align: 'center',
    dataIndex: 'debt',
    key: 'debt',
    render: (data) => (
      <span>
        {(data || 0) / 100}
        $
      </span>
    ),
  }, {
    title: 'TOTAL PAID AMOUNT',
    align: 'center',
    dataIndex: 'total_paid',
    key: 'total_paid',
    render: (data) => (
      <span>
        {(data || 0) / 100}
        $
      </span>
    ),
  }, {
    title: 'ACTIONS',
    align: 'center',
    key:'actions',
    render: (data, row) => (
      <div className="buttons-group">
        <Button type={!row.is_suspended ? 'danger' : 'primary'} onClick={() => { setSelectedProject(row); setIsModal('suspend'); }}>
          { !row.is_suspended ? 'Suspend project' : 'Unsuspend project' }
        </Button>
        <Button type="danger" onClick={() => setIsPaymentModal(row._id)}>
          Try payment
        </Button>
        <Button type="danger" onClick={() => { setSelectedProject(row); setIsModal('delete'); }}>
          Delete project
        </Button>
      </div>
    ),
  },
  ];

  const handleChangeTime = (value) => {
    setShowTime(value);
  };

  const handleTryPayment = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/admin/project/${isPaymentModal}/pay`);
    } catch (err) {
      if (err.response.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error(err.response.data);
      }
    }
    setIsPaymentModal(null);
  };

  return (
    <>
      <ProfileHeader />
      <div className="table-container">
        <div>
          <div className="table-header">
            <Link to="/dashboard/users">
              <Button icon={<LeftOutlined />} />
            </Link>
            <h2 className="dashboard-title">Admin Dashboard</h2>
          </div>
          <div className="time-selector">
            <span style={{ marginRight: '10px' }}>Show time in</span>
            <Select
              value={showTime}
              style={{ width: 120 }}
              options={options}
              onChange={handleChangeTime}
            />
          </div>
        </div>
        { loading
          ? <LoadingOutlined className="loading" />
          : (
            <Table
              className="table"
              columns={columns}
              dataSource={projects}
              rowKey={row=>row._id}
            />
          )}
      </div>
      <DashboardProjectsModal
        isModal={isModal}
        setIsModal={setIsModal}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        getUser={getUser}
      />
      <Modal
        visible={isPaymentModal}
        onOk={() => handleTryPayment()}
        onCancel={() => setIsPaymentModal(null)}
      >
        Are you sure that you want to try payment
      </Modal>
    </>
  );
};

export default DashboardProjectsTable;
