import { useState } from 'react'
import { parseUnits, formatUnits } from '@ethersproject/units'

import styled from 'styled-components'
import { themeGet } from '@styled-system/theme-get'

import {
  Form,
  Label,
  TextField,
  TextAreaField,
  FieldError,
  Submit,
} from '@redwoodjs/forms'

import SubscribeForm from 'src/components/SubscribeForm/SubscribeForm'

import { subscribeToIDA } from 'src/web3/auction'

export const Container = styled.div`
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
`

const Web3User = ({ web3User, auctionAddress }) => {
  const { superTokenBalance, isSubscribed } = web3User

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(!isSubscribed)

  const handleError = (error) => {
    setError(error.message)
    setLoading(false)
  }

  const onSubscribe = async () => {
    setLoading(true)
    setError(null)
    const { tx, error: submitError } = await subscribeToIDA({ auctionAddress })
    if (submitError) return handleError(submitError)
    await tx.wait()
    setShowForm(false)
    setLoading(false)
  }

  return (
    <Container>
      <header className="rw-segment-header">
        <h2 className="rw-heading rw-heading-secondary">
          Your Superfluid Account
        </h2>
      </header>
      <table className="rw-table">
        <tbody>
          <tr>
            <th>DAIx Balance</th>
            <td>{Number(formatUnits(superTokenBalance, 18)).toFixed(6)}</td>
          </tr>
        </tbody>
      </table>
      {showForm && (
        <SubscribeForm error={error} loading={loading} onSave={onSubscribe} />
      )}
    </Container>
  )
}

export default Web3User
