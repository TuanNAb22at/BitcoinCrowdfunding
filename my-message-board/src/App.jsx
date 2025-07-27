import React, { useState, useEffect } from 'react';
import { connect, StacksTestnet } from '@stacks/connect';
import { AppConfig, UserSession } from '@stacks/connect';
import { ContractCallOptions, openContractCall } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function App() {
  const [userData, setUserData] = useState(null);
  const [status, setStatus] = useState(null);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  // Kết nối ví
  const handleConnect = async () => {
    connect({
      userSession,
      appDetails: {
        name: 'Crowdfunding App',
        icon: window.location.origin + '/logo.png',
      },
      onFinish: (data) => {
        setUserData(data.userSession.loadUserData());
      },
    });
  };

  // Đăng xuất
  const handleDisconnect = () => {
    userSession.signUserOut();
    setUserData(null);
  };

  // Lấy trạng thái hợp đồng
  const getStatus = async () => {
    const options = {
      contractAddress: contractAddress,
      contractName: 'crowdfunding',
      functionName: 'get-status',
      functionArgs: [],
      network: new StacksTestnet(),
      senderAddress: userData?.profile?.stxAddress?.testnet,
    };

    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/v2/contracts/call-read/${options.contractAddress}/${options.contractName}/${options.functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: options.senderAddress,
            arguments: options.functionArgs,
          }),
        }
      );
      const data = await response.json();
      setStatus(data.result);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  // Đóng góp
  const handlePledge = async () => {
    const options = {
      contractAddress: contractAddress,
      contractName: 'crowdfunding',
      functionName: 'pledge',
      functionArgs: [
        {
          type: 'uint',
          value: pledgeAmount,
        },
      ],
      network: new StacksTestnet(),
      appDetails: {
        name: 'Crowdfunding App',
        icon: window.location.origin + '/logo.png',
      },
      onFinish: (data) => {
        console.log('Transaction submitted:', data);
        getStatus();
      },
    };

    await openContractCall(options);
  };

  // Hoàn tiền
  const handleRefund = async () => {
    const options = {
      contractAddress: contractAddress,
      contractName: 'crowdfunding',
      functionName: 'refund',
      functionArgs: [],
      network: new StacksTestnet(),
      appDetails: {
        name: 'Crowdfunding App',
        icon: window.location.origin + '/logo.png',
      },
      onFinish: (data) => {
        console.log('Refund transaction submitted:', data);
        getStatus();
      },
    };

    await openContractCall(options);
  };

  // Nhận tiền (chủ dự án)
  const handleClaimFunds = async () => {
    const options = {
      contractAddress: contractAddress,
      contractName: 'crowdfunding',
      functionName: 'claim-funds',
      functionArgs: [],
      network: new StacksTestnet(),
      appDetails: {
        name: 'Crowdfunding App',
        icon: window.location.origin + '/logo.png',
      },
      onFinish: (data) => {
        console.log('Claim funds transaction submitted:', data);
        getStatus();
      },
    };

    await openContractCall(options);
  };

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Crowdfunding Platform</h1>
        {!userData ? (
          <button onClick={handleConnect}>Connect Wallet</button>
        ) : (
          <div>
            <p>Connected as: {userData.profile.stxAddress.testnet}</p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>
        )}
      </header>

      <div className="contract-section">
        <h2>Contract Interaction</h2>
        <input
          type="text"
          placeholder="Contract Address"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
        <button onClick={getStatus}>Get Status</button>
      </div>

      {status && (
        <div className="status">
          <h3>Campaign Status</h3>
          <p>Goal: {status.funding-goal} µSTX</p>
          <p>Pledged: {status.total-pledged} µSTX</p>
          <p>Deadline: Block {status.deadline}</p>
          <p>Status: {status.funding-successful ? 'Successful' : 'Not Funded'}</p>
        </div>
      )}

      <div className="actions">
        <h3>Actions</h3>
        <div>
          <input
            type="number"
            placeholder="Amount (µSTX)"
            value={pledgeAmount}
            onChange={(e) => setPledgeAmount(e.target.value)}
          />
          <button onClick={handlePledge}>Pledge</button>
        </div>
        <button onClick={handleRefund}>Request Refund</button>
        <button onClick={handleClaimFunds}>Claim Funds (Owner Only)</button>
      </div>
    </div>
  );
}

export default App;