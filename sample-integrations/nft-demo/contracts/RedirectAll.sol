// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

import {
    ISuperfluid,
    ISuperToken,
    ISuperAgreement,
    ISuperApp,
    SuperAppBase,
    SuperAppDefinitions
} from "./SuperAppBase.sol";

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

contract RedirectAll is SuperAppBase {

    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token
    address private _receiver;

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken,
        address receiver) {
        assert(address(host) != address(0));
        assert(address(cfa) != address(0));
        assert(address(acceptedToken) != address(0));
        assert(address(receiver) != address(0));
        assert(!_host.isApp(ISuperApp(receiver)));

        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
        _receiver = receiver;

        uint256 configWord =
            SuperAppDefinitions.TYPE_APP_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);
    }


    /**************************************************************************
     * Redirect Logic
     *************************************************************************/

    function currentReceiver()
        external view
        returns (
            uint256 startTime,
            address receiver,
            int96 flowRate
        )
    {
        if (_receiver != address(0)) {
            (startTime, flowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _receiver);
            receiver = _receiver;
        }
    }

    event ReceiverChanged(address receiver); //what is this?

    /// @dev If a new stream is opened, or an existing one is opened
    function _updateOutflow(bytes calldata ctx)
        private
        returns (bytes memory newCtx)
    {
      newCtx = ctx;
      // @dev This will give me the new flowRate, as it is called in after callbacks
      int96 netFlowRate = _cfa.getNetFlow(_acceptedToken, address(this));
      (,int96 outFlowRate,,) = _cfa.getFlow(_acceptedToken, address(this), _receiver);
      int96 inFlowRate = netFlowRate + outFlowRate;

      // @dev If inFlowRate === 0, then delete existing flow.
      if (outFlowRate != int96(0)){
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                _receiver,
                inFlowRate,
                new bytes(0) // placeholder
            ),
            newCtx
        );
      } else if (inFlowRate == int96(0)) {
        // @dev if inFlowRate is zero, delete outflow.
          (newCtx, ) = _host.callAgreementWithContext(
              _cfa,
              abi.encodeWithSelector(
                  _cfa.deleteFlow.selector,
                  _acceptedToken,
                  address(this),
                  _receiver,
                  new bytes(0) // placeholder
              ),
              newCtx
          );
      } else {
      // @dev If there is no existing outflow, then create new flow to equal inflow
          (newCtx, ) = _host.callAgreementWithContext(
              _cfa,
              abi.encodeWithSelector(
                  _cfa.createFlow.selector,
                  _acceptedToken,
                  _receiver,
                  inFlowRate,
                  new bytes(0) // placeholder
              ),
              newCtx
          );
      }
    }

    // @dev Change the Receiver of the total flow
    function _changeReceiver( address newReceiver ) internal {
        require(newReceiver != address(0), "New receiver is zero address");
        // @dev because our app is registered as final, we can't take downstream apps
        require(!_host.isApp(ISuperApp(newReceiver)), "New receiver can not be a superApp");
        if (newReceiver == _receiver) return ;
        // @dev delete flow to old receiver
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                address(this),
                _receiver,
                new bytes(0)
            )
        );
        // @dev create flow to new receiver
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                newReceiver,
                _cfa.getNetFlow(_acceptedToken, address(this)),
                new bytes(0)
            )
        );
        // @dev set global receiver to new receiver
        _receiver = newReceiver;

        emit ReceiverChanged(_receiver);
    }

    /**************************************************************************
     * SuperApp callbacks
     *************************************************************************/

    function afterAgreementCreated(
        ISuperToken superToken,
        bytes calldata ctx,
        address agreementClass,
        bytes32 /*agreementId*/,
        bytes calldata /*cbdata*/
    )
        external override
        onlyExpected(superToken, agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateOutflow(ctx);
    }

    function afterAgreementUpdated(
        ISuperToken superToken,
        bytes calldata ctx,
        address agreementClass,
        bytes32 /*agreementId*/,
        bytes calldata /*cbdata*/
    )
        external override
        onlyExpected(superToken, agreementClass)
        onlyHost
        returns (bytes memory newCtx)
    {
        return _updateOutflow(ctx);
    }

    function afterAgreementTerminated(
        ISuperToken superToken,
        bytes calldata ctx,
        address agreementClass,
        bytes32 /* agreementId */,
        bytes calldata /*cbdata*/
    )
        external override
        onlyHost
        returns (bytes memory newCtx)
    {
        // According to the app basic law, we should never revert in a termination callback
        if (!_isSameToken(superToken) || !_isCFAv1(agreementClass)) return ctx;
        return _updateOutflow(ctx);
    }

    function _isSameToken(ISuperToken superToken) private view returns (bool) {
        return address(superToken) == address(_acceptedToken);
    }

    function _isCFAv1(address agreementClass) private pure returns (bool) {
        return ISuperAgreement(agreementClass).agreementType()
            == keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
    }

    modifier onlyHost() {
        require(msg.sender == address(_host), "RedirectAll: support only one host");
        _;
    }

    modifier onlyExpected(ISuperToken superToken, address agreementClass) {
        require(_isSameToken(superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }

}
