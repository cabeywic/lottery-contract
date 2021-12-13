// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.4.17;

contract Lottery {
    address public manager;

    address[] players;

    function Lottery() public {
        manager = msg.sender;
    }

    function join() public payable {
        require(msg.value > 0.001 ether);
        players.push(msg.sender);
    }

    function getPlayers() public view restricted returns(address[]) {
        return players;
    }

    function random() private view returns(uint){
        return uint(keccak256(block.difficulty, now, players));
    }

    function pickWinner() public restricted {
        uint index = random() % players.length;
        players[index].transfer(this.balance);
        players = new address[](0);
    }

    modifier restricted {
        require(msg.sender == manager);
        _;
    }
}
