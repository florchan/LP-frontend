import React, { useState, useEffect } from 'react';
import styles from './userProfile.module.less';
import ProfileHeader from '../../subComponents/Header/ProfileHeader'
import { Input, Button, message, Select } from 'antd';
import { useHistory } from 'react-router-dom';
import moment from 'moment-timezone';
import { AutoComplete } from 'antd';
import axios from 'axios';

const UserProfile = () => {
    const [showChange, setShowChange] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const [timezone, setTimezone] = useState('')
    let tz;
    
    const timeZones = moment.tz.names();
    const options = [];
  
    for (const i in timeZones) {
        options.push({ value: `(GMT${moment.tz(timeZones[i]).format('Z')})${timeZones[i]}`});
    }

  const handeChangetimezone = (value) =>{
    setTimezone(value)
  }

// const options = [
//   { value: 'Burns Bay Road' },
//   { value: 'Downing Street' },
//   { value: 'Wall Street' },
// ];
    useEffect(() => {
        const fetchData = async () => {
            await getUser();
        }
        fetchData();
    }, []);

    const getUser = async () => {
        try {
            setIsLoading(true);
            const id = localStorage.getItem('userId');
            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/users/${id}`);
            setName(data.fullname);
            setEmail(data.email);
            setTimezone(data.timezone)
            setIsLoading(false);
        } catch (err) {
            err.response.data.message ? (
                message.error(err.response.data.message)
               ) : (
                 message.error(err.response.data)
              )
            setIsLoading(false);
        }
    }

    const [isLoading, setIsLoading] = useState(false);

    const toggleChange = () => setShowChange(!showChange);
    const updateProfile = async () => {
        if (password1 !== password2) {
            message.error('The passwords do not match');
            return;
        }

        if (timezone){

             tz =  moment.tz(timezone.split(')')[1])._z === null ? '(GMT+00:00)UTC' : timezone
        } else{
            tz = ''
        }
        const body = {
            password: password1,
            fullname: name,
            email,
            timezone: tz,
        }

        try {
            setIsLoading(true);
            const id = localStorage.getItem('userId');
            if (!body.password) delete body.password
            const res = await axios.put(`${process.env.REACT_APP_API_URL}/users/${id}`, body);
            localStorage.setItem('timezone', res.data.timezone)
            message.success('The profile was updated successfully');
            setIsLoading(false);
        } catch (err) {
            err.response.data.message ? (
                message.error(err.response.data.message)
               ) : (
                 message.error(err.response.data)
              )
            setIsLoading(false);
        }
    }

    const history = useHistory();
    return (
        <>
            <ProfileHeader />
            <div className="flex-c">
                <div className={styles.userProfileContainer}>
                    <div className={styles.userProfileHeader}>
                        <span className={styles.userProfileHeaderSpan}>User Profile</span>
                    </div>

                    <div className={styles.userProfileContent}>
                        <div className="main-input">
                            Name
                            <Input size="large" value={name} onChange={({ target }) => setName(target.value)} />
                        </div>

                        <div className="main-input">
                            Email
                            <Input size="large" value={email} onChange={({ target }) => setEmail(target.value)} />
                        </div>
                        <div className="main-input">
                        Timezone

                        <Select
                            showSearch
                            size="large"
                            options={options}
                            value={timezone}
                            style={{ width: '100%' }}
                            optionFilterProp="children"
                            onChange={handeChangetimezone}
                                filterOption={(inputValue, option) => option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}

                        />
                        
                        </div>
                        <div className="main-input">
                            Current Password
                            <div style={{ display: "flex" }}>
                                <Input type="password" size="large" disabled value="**********" />
                                <Button size="large" type="link" onClick={toggleChange}>Change</Button>
                            </div>
                        </div>

                        {showChange && <div className="main-input">
                            New Password
                            <Input type="password" size="large" value={password1} onChange={({ target }) => setPassword1(target.value)} />
                        </div>}

                        {showChange && <div className="main-input">
                            Confirmation Password
                            <Input type="password" size="large" value={password2} onChange={({ target }) => setPassword2(target.value)} />
                        </div>}
                    </div>

                    <div className={styles.userProfileFooter}>
                        <Button onClick={() => history.goBack()}>Cancel</Button>
                        <Button disabled={isLoading} onClick={async () => await updateProfile()} type="primary">Save</Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserProfile;
