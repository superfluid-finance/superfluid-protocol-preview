// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "./interfaces/IERC165.sol";
import "./interfaces/IERC173.sol";

import {
    ISuperfluid,
    ISuperToken,
    ISuperApp,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

contract DmsApp is ISuperApp {

    int96 constant private FEE_RATE = int96(uint256(1e18) / uint256(3600 * 24 * 30));

    struct Config {
        address newOwner;
        address wallet;
        ISuperToken superToken;
        bytes32 agreementId;
    }

    mapping(address => Config) private _actions;
    mapping(bytes32 => address) private _userAgreements;
    IConstantFlowAgreementV1 private _constantFlow;
    ISuperfluid _host;

    constructor(ISuperfluid superfluid, IConstantFlowAgreementV1 constantFlow) {
        require(address(constantFlow) != address(0), "DMS: can't set zero address as constant Flow");
        require(address(superfluid) != address(0), "DMS: can't set zero address as Superfluid");

        _constantFlow = constantFlow;
        _host = superfluid;

        uint256 configWord =
            SuperAppDefinitions.TYPE_APP_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.AFTER_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }

    function config(address wallet, address newOwner) external {
        require(newOwner != address(0), "DMS: Define a new Owner");
        require(newOwner != msg.sender, "DMS: New Owner can't the the same sender");
        require(_actions[msg.sender].newOwner == address(0), "DMS: only one configuration allowed");
        require(IERC165(wallet).supportsInterface(0x7f5828d0) == true, "DMS: Wallet not compliant");
        require(IERC173(wallet).owner() == address(this), "DMS: DMS is not owner of wallet");

        _actions[msg.sender] = Config(newOwner, wallet, ISuperToken(0), 0);
    }

    function beforeAgreementCreated(
        ISuperToken /*superToken*/,
        bytes calldata /*ctx*/,
        address /*agreementClass*/,
        bytes32 /*agreementId*/
    )
        external
        view
        virtual
        override
        returns (bytes memory /*cbdata*/)
        {
            revert("Unsupported callback - Before Agreement Created");
        }

        function afterAgreementCreated(
            ISuperToken superToken,
            bytes calldata ctx,
            address /*agreementClass*/,
            bytes32 agreementId,
            bytes calldata /*cbdata*/
        )
            external
            virtual
            override
            returns (bytes memory newCtx)
            {
                newCtx = ctx;
                (,,address sender,,) = _host.decodeCtx(ctx);
                require(_actions[sender].wallet != address(0), "DMS: make config first");
                require(_actions[sender].agreementId == 0, "DMS: stream already configured");
                (, int96 receivingFlowRate, , ) = _constantFlow.getFlowByID(superToken, agreementId);
                require(receivingFlowRate == FEE_RATE, "DMS: stream correct amount");

                _actions[sender].superToken = superToken;
                _actions[sender].agreementId = agreementId;
                _userAgreements[agreementId] = sender;
            }

            function beforeAgreementUpdated(
                ISuperToken /*superToken*/,
                bytes calldata /*ctx*/,
                address /*agreementClass*/,
                bytes32 /*agreementId*/
            )
                external
                view
                virtual
                override
                returns (bytes memory /*cbdata*/)
            {
                revert("Unsupported callback - Before Agreement updated");
            }

            function afterAgreementUpdated(
                ISuperToken /*superToken*/,
                bytes calldata /*ctx*/,
                address /*agreementClass*/,
                bytes32 /*agreementId*/,
                bytes calldata /*cbdata*/
            )
                external
                virtual
                override
                returns (bytes memory /*newCtx*/)
            {
                revert("Unsupported callback - After Agreement Updated");
            }

            function beforeAgreementTerminated(
                ISuperToken /*superToken*/,
                bytes calldata /*ctx*/,
                address /*agreementClass*/,
                bytes32 /*agreementId*/
            )
                external
                view
                virtual
                override
                returns (bytes memory /*cbdata*/)
            {
                revert("Unsupported callback -  Before Agreement Terminated");
            }

            function afterAgreementTerminated(
                ISuperToken superToken,
                bytes calldata ctx,
                address /*agreementClass*/,
                bytes32 agreementId,
                bytes memory /*cbdata*/
            )
                external
                virtual
                override
                returns (bytes memory newCtx)
            {
                newCtx = ctx;
                //(,,address sender,,) = _host.decodeCtx(ctx);

                address sender = _userAgreements[agreementId];

                if(_actions[sender].superToken == superToken && _actions[sender].agreementId == agreementId) {
                    transferWallet(_actions[sender].wallet, _actions[sender].newOwner);
                    delete _actions[sender];
                    delete _userAgreements[agreementId];
                }
            }

            //Transfer external wallet to defined new Owner
            function transferWallet(address wallet, address newOwner) internal returns(bool) {
                IERC173(wallet).transferOwnership(newOwner);
            }
}
