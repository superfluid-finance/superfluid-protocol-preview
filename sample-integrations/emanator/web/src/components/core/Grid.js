import React from 'react'
import styled, { css } from 'styled-components'
import PropTypes from 'prop-types'
import { themeGet } from '@styled-system/theme-get'

// Six columns grid system
const colWidths = [
  16.6666666667,
  33.3333333334,
  50,
  66.6666666668,
  83.3333333335,
  100,
]

const availableColumns = [...Array(colWidths.length).keys()].map((val) => ++val)

const Col = styled.div`
  --colWidth: ${({ sm }) =>
    sm && (sm === 'auto' ? 'auto' : `${colWidths[sm - 1]}%`)};
  width: var(--colWidth);
  overflow: hidden;
  ${({ isResponsive }) =>
    isResponsive &&
    css`
      --colWidth: ${`${colWidths[0]}%`};
      flex: 1;
    `}
  ${({ md }) =>
    md &&
    css`
      @media (min-width: ${themeGet('breakpoints.md')}) {
        --colWidth: ${({ md }) =>
          md === 'auto' ? 'auto' : `${colWidths[md - 1]}%`};
      }
    `}
  ${({ lg }) =>
    lg &&
    css`
      @media (min-width: ${themeGet('breakpoints.xl')}) {
        --colWidth: ${({ lg }) =>
          lg === 'auto' ? 'auto' : `${colWidths[lg - 1]}%`};
      }
    `}
`

/** @component */
const Row = styled.div`
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  width: ${({ gap }) => `calc(100% + ${gap} )`};
  margin: ${({ gap }) => gap && `0 calc(-${gap} / 2)`};

  ${Col} {
    padding: ${({ gap }) => gap && `0 calc(${gap} / 2)`};
    width: ${({ gap }) => gap && `var(--colWidth)`};
    flex-basis: ${({ gap }) => gap && `var(--colWidth)`};
  }
`
Row.defaultProps = {
  gap: '6.25%',
}
Row.propTypes = {
  gap: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

const Column = ({ sm, md, lg, children, className }) => {
  const isResponsive = [sm, md, lg].every((el) => typeof el === 'undefined')

  return (
    <Col
      md={md}
      sm={sm}
      lg={lg}
      isResponsive={isResponsive}
      className={className}
    >
      {children}
    </Col>
  )
}
Column.defaultProps = {
  sm: undefined,
  md: undefined,
  lg: undefined,
  className: '',
  children: <></>,
}
Column.propTypes = {
  /**
 ```
Breakpoints are pulled from theme
"sm" = 0px - 767px
"md" = 768px - 1023px
"lg" = 1024px - ∞px

Passing number from 1 to 6 will make column take space divided by 6 (sm={3} will take 3/6 of space which is 50% )

Passing "auto" (sm="auto") to one of this props will make column take remaining space.

```*/
  children: PropTypes.node,
  className: PropTypes.string,
  lg: PropTypes.PropTypes.oneOf(['auto', ...availableColumns]),
  sm: PropTypes.PropTypes.oneOf(['auto', ...availableColumns]),
  md: PropTypes.PropTypes.oneOf(['auto', ...availableColumns]),
}

export { Row, Column }
