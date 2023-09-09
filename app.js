import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const contractAddress = "0x131a2E76caC61a38FEddaf1B2C1F7b893F4daE25";
const contractABI = [{"name": "Transfer", "inputs": [{"name": "sender", "type": "address", "indexed": true}, {"name": "receiver", "type": "address", "indexed": true}, {"name": "value", "type": "uint256", "indexed": false}], "anonymous": false, "type": "event"}, {"stateMutability": "nonpayable", "type": "constructor", "inputs": [{"name": "_name", "type": "string"}, {"name": "_symbol", "type": "string"}, {"name": "_total_supply", "type": "uint256"}, {"name": "_dummy", "type": "string"}], "outputs": []}, {"stateMutability": "nonpayable", "type": "function", "name": "transfer", "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "outputs": [{"name": "", "type": "bool"}]}, {"stateMutability": "view", "type": "function", "name": "external_func", "inputs": [{"name": "_str", "type": "string"}], "outputs": [{"name": "", "type": "string"}]}, {"stateMutability": "view", "type": "function", "name": "name", "inputs": [], "outputs": [{"name": "", "type": "string"}]}, {"stateMutability": "view", "type": "function", "name": "symbol", "inputs": [], "outputs": [{"name": "", "type": "string"}]}, {"stateMutability": "view", "type": "function", "name": "totalSupply", "inputs": [], "outputs": [{"name": "", "type": "uint256"}]}, {"stateMutability": "view", "type": "function", "name": "balances", "inputs": [{"name": "arg0", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}]}]

let contract;
let signerAccount;

window.onload = init;
document.getElementById('connectButton').addEventListener('click', ConnectWithMetamask);
document.getElementById('sendButton').addEventListener('click', sendToken);

// 初期設定
async function init() {
    if (typeof window.ethereum === "undefined") {
        // MetaMask未インストール時の処理
        handleMetaMaskNotInstalled();
    } else {
        // 接続済アカウントを取得
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length === 0 || chainId !== "0xaa36a7") {
            // アカウント未接続 or NWが異なる場合の処理
            handleAccountNotConnected();
        } else {
            // アカウント接続済、NWが正しい場合の処理
            handleAccountConnected();
        }
    }
}

// MetaMask未インストール時の処理
function handleMetaMaskNotInstalled() {
    document.getElementById("isNotInstalled").style.display = "block";
    document.getElementById("isNotConnected").style.display = "none";
    document.getElementById("isConnected").style.display = "none";
}

// アカウント未接続 or NWが異なる場合の処理
function handleAccountNotConnected() {
    document.getElementById("isNotInstalled").style.display = "none";
    document.getElementById("isNotConnected").style.display = "block";
    document.getElementById("isConnected").style.display = "none";
}

// アカウント接続済、NWが正しい場合の処理
async function handleAccountConnected() {
    document.getElementById("isNotInstalled").style.display = "none";
    document.getElementById("isNotConnected").style.display = "none";
    document.getElementById("isConnected").style.display = "block";

    // アカウント変更時、NW変更時にリロード
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());

    // contractの取得
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    // アカウント表示
    signerAccount = await signer.getAddress();
    document.getElementById("signerAccount").innerText = signerAccount;
    
    // 残高表示
    displayBalance();

    // イベントモニタリング開始
    listenForTransfer();
}

// MetaMask接続ボタンの処理
async function ConnectWithMetamask() {
    // アカウントの接続承認
    await window.ethereum.request({ method: "eth_requestAccounts" })
    // Sepoliaへの切り替え
    await switchToSepoliaNetwork();
    // アカウント接続済、NWが正しい場合の処理
    handleAccountConnected();
}

// Sepoliaへの切り替え
async function switchToSepoliaNetwork() {
    try {
        // Sepoliaへの切り替え
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                    "chainId": "0xaa36a7",
                }
            ],
        });
    } catch (switchError) {
        // NWがない場合は追加
        if (switchError.code === 4902) {
            await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        "chainName": "Sepolia Test Network",
                        "rpcUrls": ["https://rpc.sepolia.dev"],
                        "chainId": "0xaa36a7",
                        "blockExplorerUrls": ["https://sepolia.etherscan.io/"]
                    }
                ],
            });
        } else {
            throw new Error
        }
    }
}

// 残高表示
async function displayBalance() {
    const balance = await contract.balances(signerAccount);
    document.getElementById("balance").innerText = balance.toString();
}

// 送信ボタンの処理
async function sendToken() {
    // 送信ボタン無効化
    const sendButton = document.getElementById("sendButton");
    const buttonText = document.getElementById("buttonText");
    const spinner = document.getElementById("spinner");

    sendButton.disabled = true;
    buttonText.textContent = "マイニング中...";
    spinner.style.display = "inline-block";

    const value = document.getElementById("valueToSend").value;
    const receiver = document.getElementById("receiverAccount").value;

    try {
        // トランザクション送信処理
        const tx = await contract.transfer(receiver, value);   
        // トランザクション完了待ち
        await tx.wait(); 
        // 残高更新
        balanceAnimation();
        displayBalance();
    } catch (error) {
        console.error(error);
        alert("送信エラー")
    } finally {
        // ボタンを有効化
        sendButton.disabled = false;
        buttonText.textContent = "TETを送る";
        spinner.style.display = "none";
    }
}

// イベントモニタリング
async function listenForTransfer() {
    contract.on("Transfer", async (sender, receiver, value, event) => {
        if (receiver === signerAccount) {
            // 残高表示を更新
            balanceAnimation();
            displayBalance();
        }
    });
}

// 残高アニメーション
function balanceAnimation() {
    const element = document.getElementById('changeAnimation');
    element.classList.add('animate__animated', 'animate__bounce');

    // アニメーションが終了したらクラスを削除
    element.addEventListener('animationend', () => {
        element.classList.remove('animate__animated', 'animate__bounce');
    });
}
