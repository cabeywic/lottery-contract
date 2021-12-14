const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile');

let accounts;
let contract;

beforeEach(async() => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();


    // Use one of the accounts to deploy the contract
    contract = await new web3.eth.Contract(JSON.parse(interface))
     .deploy({ data: bytecode })
     .send({ from: accounts[0], gas: '1000000' })

})

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(contract.options.address)
    });

    it('has a manager', async () => {
        let manager = await contract.methods.manager().call();
        assert.equal(manager, accounts[0])
    });

    it('requires at least 0.001 ether to join', async () => {
        try {
            await contract.methods.join().send({ from: accounts[0], value: web3.utils.toWei('0.0005', 'ether') });
            assert(false);
        } catch (error) {
            assert(error);
        }
    });

    it('allows multiple players to join', async () => {
        await contract.methods.join().send({ from: accounts[0], value: web3.utils.toWei('1', 'ether') });
        await contract.methods.join().send({ from: accounts[1], value: web3.utils.toWei('1', 'ether') });
        await contract.methods.join().send({ from: accounts[2], value: web3.utils.toWei('1', 'ether') });

        let players = await contract.methods.getPlayers().call({ from: accounts[0] });

        assert.equal(players.length, 3)
    });

    it('allows only manager to call pickWinner', async () => {
        try {
            await contract.methods.join().send({ from: accounts[0], value: web3.utils.toWei('2', 'ether') });
            await contract.methods.pickWinner().send({ from: accounts[1] })
            assert(false)
        } catch(error) {
            assert(error);
        }
    });

    it('sends money to the winner and resets the player array', async () => {
        await contract.methods.join().send({ from: accounts[0], value: web3.utils.toWei('2', 'ether') });

        let initBalance = await web3.eth.getBalance(accounts[0]);
        await contract.methods.pickWinner().send({ from: accounts[0] })
        let finalBalance = await web3.eth.getBalance(accounts[0]);

        let difference = finalBalance-initBalance;
        assert(difference > web3.utils.toWei('1.8', 'ether'))
    });

})