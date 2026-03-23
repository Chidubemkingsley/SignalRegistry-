// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISignalRegistry {
    function register() external payable;
    function deregister() external;
}

contract ReentrantMock {
    ISignalRegistry public registry;

    constructor(address _registry) {
        registry = ISignalRegistry(_registry);
    }

    function fundAndRegister() external payable {
        registry.register{value: msg.value}();
    }

    function attackDeregister() external {
        registry.deregister();
    }

    // fallback triggers reentrancy if possible
    fallback() external payable {
        // attempt to reenter
        try registry.deregister() {} catch {}
    }
}