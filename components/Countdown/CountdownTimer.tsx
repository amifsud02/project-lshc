'use client';

import React from 'react';
import DateTimeDisplay from './DateTimeDisplay';
import { useCountdown } from './useCountdown';

const ExpiredNotice = () => {
  return (
    <div className="expired-notice">
      <span>Match Commenced</span>
    </div>
  );
};

const ShowCounter = ({ days, hours, minutes, seconds }: any) => {
  return (
    <div className="show-counter">
      <div className="countdown-link">
        <div className="countdown-indicator">
          <DateTimeDisplay value={days} type={'Days'} isDanger={false} />
          <span>Days</span>
        </div>
        <span style={{transform: "translateY(-15px)"}}>:</span>
        <div className="countdown-indicator">
          <DateTimeDisplay value={hours} type={'Hours'} isDanger={false} />
          <span>Hours</span>
        </div>
        <span style={{transform: "translateY(-15px)"}}>:</span>
        <div className="countdown-indicator">
          <DateTimeDisplay value={minutes} type={'Mins'} isDanger={false} />
          <span>Mins</span>
        </div>   
        <span style={{transform: "translateY(-15px)"}}>:</span>
        <div className="countdown-indicator">
          <DateTimeDisplay value={seconds} type={'sec'} isDanger={false} />
          <span>Sec</span>
        </div>      
      </div>
    </div>
  );
};

const CountdownTimer = ({ targetDate }: any) => {
  const [days, hours, minutes, seconds] = useCountdown(targetDate);

  if (days + hours + minutes + seconds <= 0) {
    return <ExpiredNotice />;
  } else {
    return (
      <ShowCounter
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
    );
  }
};

export default CountdownTimer;