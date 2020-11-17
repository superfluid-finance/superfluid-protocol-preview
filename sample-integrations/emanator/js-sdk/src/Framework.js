import { InfuraProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'

const SuperfluidABI = require('../build/abi')
const getConfig = require('./getConfig')

function Framework({ web3Provider, version, chainId }) {
  const contractNames = Object.keys(SuperfluidABI)

  this.chainId = chainId
  this.version = version || 'test'

  // load contracts
  this.contracts = {}

  if (!web3Provider) throw new Error('web3Provider is required')
  this.web3Provider = web3Provider
}

Framework.prototype.initialize = async function () {
  const chainId = this.chainId || (await this.web3.eth.net.getId()) // TODO use eth.getChainId;
  console.log('chainId', chainId)

  const config = getConfig(chainId)

  console.debug('Resolver at', config.resolverAddress)

  this.resolver = new Contract(
    config.resolverAddress,
    SuperfluidABI[IResolver],
    this.web3Provider
  )

  console.debug('Resolving contracts with version', this.version)
  const superfluidAddress = await this.resolver.call(
    `Superfluid.${this.version}`
  )
  const cfaAddress = await this.resolver.call(
    `ConstantFlowAgreementV1.${this.version}`
  )
  const idaAddress = await this.resolver.call(
    `InstantDistributionAgreementV1.${this.version}`
  )
  console.debug('Superfluid', superfluidAddress)
  console.debug('ConstantFlowAgreementV1', cfaAddress)
  console.debug('InstantDistributionAgreementV1', idaAddress)

  this.host = await this.contracts.ISuperfluid.at(superfluidAddress)
  this.agreements = {
    cfa: await this.contracts.IConstantFlowAgreementV1.at(cfaAddress),
    ida: await this.contracts.IInstantDistributionAgreementV1.at(idaAddress),
  }
}

Framework.prototype.getERC20Wrapper = async function (tokenInfo) {
  const tokenInfoSymbol = await tokenInfo.symbol.call()
  return await this.host.getERC20Wrapper.call(
    tokenInfo.address,
    `${tokenInfoSymbol}x`
  )
}

Framework.prototype.createERC20Wrapper = async function (tokenInfo) {
  const tokenInfoName = await tokenInfo.name.call()
  const tokenInfoSymbol = await tokenInfo.symbol.call()
  const tokenInfoDecimals = await tokenInfo.decimals.call()
  await this.host.createERC20Wrapper(
    tokenInfo.address,
    tokenInfoDecimals,
    `Super ${tokenInfoName}`,
    `${tokenInfoSymbol}x`
  )
}

export default Framework
