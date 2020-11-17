import { Form, Submit } from '@redwoodjs/forms'
import styled from 'styled-components'
import { themeGet } from '@styled-system/theme-get'

export const Container = styled.div`
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: ${themeGet('space.4')};
`

const FormError = ({ error }) => <div>ERROR: {error}</div>

const SubscribeForm = (props) => {
  const onSubmit = async (data) => {
    props.onSave()
  }
  return (
    <Container>
      <Form onSubmit={onSubmit}>
        <p>
          Warning: You are not subscribed to the IDA for this auction. You will
          still receive tokens, but they won't appear in your balance until you
          subscribe
        </p>
        <div className="rw-button-group">
          <Submit disabled={props.loading} className="rw-button rw-button-blue">
            Subscribe
          </Submit>
        </div>
        {props.error && <FormError error={props.error} />}
      </Form>
    </Container>
  )
}

export default SubscribeForm
