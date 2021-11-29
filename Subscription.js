/* eslint-disable no-use-before-define */
import React, { useState, useEffect } from 'react';
import {
  Button, Input, message, Modal,
} from 'antd';
import { CloseOutlined, ConsoleSqlOutlined } from '@ant-design/icons';
import { Link, useParams, useHistory } from 'react-router-dom';

import axios from 'axios';
import moment from 'moment';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '../../subComponents/Header/ProfileHeader';
import Table from './SubscriptionTable/SubscriptionTable';
import styles from './subscription.module.less';

const Subscription = () => {
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [user,setUser]= useState()
  const [loading, setLoading] = useState(false);
  const { project: projectId, plan: planName } = useParams();

  const [isModal, setIsModal] = useState(false);
  const [isPayModal, setIsPayModal] = useState(false);
  const history = useHistory();
  const stripe = useStripe();
  const elements = useElements();
  const userId = localStorage.getItem('userId');

  const payNow = {
    name: 'now_plan',
    price: user && user.discount ? '$' + (4 / 100 * (100 - user.discount)).toFixed(2) + '/day' : '$4.00/day' ,
    title: 'Now',
    text1: 'End subscription',
    text1mob: 'End sub',
    text2: '(charged daily through to your credit card)',
    text3: '(charged daily until subscription is cancelled)',

  };

  const payLater = {
    name: 'later_plan',
    price: '$5.00/day',
    title: 'Later',
    text1: 'End subscription and Pay within 14 days.',
    text1mob: 'End & Pay',
    text2: "(after authorizing we won't charge until the end of the campaign)",
    text3: '(Only preautorize, charge at the end)',
  };

  const [data, setData] = useState({});
  const [projectData, setProjectData] = useState({});
  const plan = (planName === 'now_plan') ? payNow : payLater;

  
  const togglePayment = async () => {
    const { data: { sessionId } } = await axios.put(`${process.env.REACT_APP_API_URL}/payment/${projectId}/${planName}`);

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getSubscription(), getProject()]);
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(()=>{
    async function anyNameFunction() {
      const userData = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`)
      setUser(userData.data)
    }
    // Execute the created function directly
    anyNameFunction();

  },[userId])

  const getSubscription = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/payment/${projectId}/${planName}`);
      setData(data);
    } catch (err) {
      if (err.response.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error(err.response.data);
      }
      setLoading(false);
    }
  };

  const getProject = async () => {
    try {
      const  response  = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${projectId}`);
      setProjectData(response.data);
      return response.data
    } catch (err) {
      if (err.response.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error(err.response.data);
      }
      setLoading(false);
    }
  };

  const finishSubscription = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/projects/${projectId}/finish`);
      message.success('The subscription was successfully canceled');
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${projectId}`);
      setProjectData(data);
      setIsModal(false);
      if (data.debt === 0) history.push('/myprojects');
    } catch (err) {
      if (err.response.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error(err.response.data);
      }
    }
  };

  const handlePayNow = async () => {
    try {
    await axios.post(`${process.env.REACT_APP_API_URL}/projects/${projectId}/pay`);
     message.success('The subscription was paid');
      window.dataLayer.push({
        event: 'Later Plan Payment Success',
        eventProps: {
          category: 'Later Plan',
          action: 'Payment Success',
          label: 'Later Plan - Payment Success',
        },
      });
      // = await getProject()
    const test = await new Promise(resolve => setTimeout(() =>{
       const test = getProject()
       resolve(test)
     } , 2000));

      // setTimeout(() => getProject(), 4000);
      if (!projectData.finished_at) {
        setTimeout(() => getSubscription(), 2000);
      }

      setIsPayModal(false);

      if (data.finished_at || data.debt === 0 || (test.finished_at  && test.debt ===0)) history.push('/myprojects');
    } catch (err) {
      window.dataLayer.push({
        event: 'Later Plan Payment Fail',
        eventProps: {
          category: 'Later Plan',
          action: 'Payment Fail',
          label: 'Later Plan - Payment Fail',
        },
      });
      if (err.response.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error(err.response.data);
      }
    }
  };
  return (
    <>
      <Header />
      {loading && 'Loading...'}

      {!loading && (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <span>Subscription</span>
              <span>
                {plan.text2}
              </span>
            </div>
            <div>
              {
              projectData.finished_at
                ? (
                  <Button disabled={projectData.charge_flow_status !== 'scheduled'} size="large" type="danger" icon={<CloseOutlined />} onClick={() => setIsPayModal(true)}>
                    Pay
                  </Button>
                )
                : (
                  <Button size="large" type="danger" icon={<CloseOutlined />} onClick={() => setIsModal(true)}>
                    {window.innerWidth < 768
                      ? plan.text1mob
                      : plan.text1}
                  </Button>
                )
            }
              <Modal
                visible={isModal}
                onOk={async () => await finishSubscription()}
                onCancel={() => setIsModal(false)}
              >
                Are you sure you want to cancel this subscription?
              </Modal>
              <Modal
                visible={isPayModal}
                onOk={async () => await handlePayNow()}
                onCancel={() => setIsPayModal(false)}
              >
                We'll now proceed with your payment of
                {' '}
                {(projectData.debt / 100).toFixed(2)}
                $ ?
              </Modal>
            </div>
          </div>

          <div className={styles.content}>
            <div className={`${styles.projectName} ${styles.projName}`}>
              <span>PROJECT NAME</span>
              <span>{projectData.display_name}</span>
            </div>

            <div className={`${styles.cardInfoDiv} flex`}>
              <div className={styles.projectName}>
                <span>STARTED ON</span>
                <span>{data.default_payment_method?.created && moment.unix(data.default_payment_method.created).format('DD.MM.YYYY')}</span>
              </div>

              <div className={styles.projectName}>
                <span>PRICE</span>
                <span>{plan.price}</span>
              </div>

              <div className={styles.plan}>
                <span className={styles.planSpan}>PLAN</span>
                <div
                  style={{
                    alignItems: 'center', position: 'relative', bottom: '0.35em', top: '2px',
                  }}
                  className="flex-c"
                >
                  <div className="project-icon-div">{plan.title}</div>
                </div>
              </div>
            </div>

            {!showPaymentMethod
              && (
              <div className={styles.inputHolder}>
                <label style={{ marginBottom: '0.3em' }}>
                  Payment Method
                  <span style={{ color: '#9DA4C8' }}>
                    {plan.text3}
                  </span>
                </label>
                <div className="flex">
                  <Input disabled value={data.default_payment_method && `**** **** **** ${data.default_payment_method.card.last4}`} className={styles.togglingInput} />
                  <Button onClick={togglePayment} type="link">Change</Button>
                </div>
              </div>
              )}
          </div>

          <div className={styles.footer}>
            <Link to="/myprojects">
              <Button size="large">Back</Button>
            </Link>
          </div>
        </div>
        {data.payment_intents && <Table setIsPayModal={setIsPayModal} project={projectData} items={data.payment_intents.data || data.payment_intents} />}
      </div>
      )}
    </>
  );
};

export default Subscription;
