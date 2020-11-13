import Link from 'src/components/core/Link'

const smartTrim = (string, maxLength) => {
  if (!string) return string
  if (maxLength < 1) return string
  if (string.length <= maxLength) return string
  if (maxLength == 1) return `${string.substring(0, 1)}...`

  const midpoint = Math.ceil(string.length / 2)
  const toremove = string.length - maxLength
  const lstrip = Math.ceil(toremove / 2)
  const rstrip = toremove - lstrip

  return `${string.substring(0, midpoint - lstrip)}...${string.substring(
    midpoint + rstrip
  )}`
}

const EXPLORER_DOMAIN = 'etherscan.io'

const getEtherscanAddressLink = (address, networkName) => {
  let subdomain = null
  if (networkName) subdomain = `${networkName}.`
  return `https://${subdomain}${EXPLORER_DOMAIN}/address/${address}`
}

const Address = ({ address, children }) => {
  if (!address) return <></>
  return (
    <Link
      underline
      onClick={() => window.open(getEtherscanAddressLink(address, 'goerli'))}
    >
      {children ? children : smartTrim(address, 8)}
    </Link>
  )
}

export default Address
