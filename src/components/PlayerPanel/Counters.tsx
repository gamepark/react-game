/** @jsxImportSource @emotion/react */
import { css, Interpolation, Theme } from '@emotion/react'
import { FC } from 'react'

export type CounterProps = {
  image: string
  value: number | string
} & { imageCss?: Interpolation<Theme> };

export type CountersProps = {
  counters: CounterProps[]
  lineSize: number
};

export const Counters: FC<CountersProps> = (props) => {
  const { counters, lineSize } = props
  if (!counters.length) return null
  if (counters.length === 1) return <Counter {...counters[0]} unique/>

  return (
    <div css={counterGridCss(lineSize)}>
      {counters.map((counter, i) => (
        <Counter key={i} {...counter} />
      ))}
    </div>
  )
}

const Counter: FC<{ unique?: boolean } & CounterProps> = (props) => {
  const { image, value, imageCss, unique } = props
  if (image === undefined && value === undefined) return null
  return (
    <span
      css={[
        data,
        rightAlignment,
        unique && uniqCounterCss,
        !unique && counterCss
      ]}
    >
      <div css={[mini, mainIconBackground(image), imageCss]}/>
      <span>{value}</span>
    </span>
  )
}

const counterGridCss = (size: number) => css`
  display: grid;
  grid-template-columns: repeat(${size}, 1fr);
  gap: 0.4em;
  align-items: flex-end;
`

const mainIconBackground = (image: string) => css`
  background-image: url(${image});
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
`
const mini = css`
  height: 1em;
  width: 1em;
  align-self: center;
`

const data = css`
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 0.1em 0.3em;
  border-radius: 0.4em;
  z-index: 2;
`

const rightAlignment = css`
  left: initial;
  right: 0.2em;
  font-size: 2.5em;
`

const uniqCounterCss = css`
  width: 3.5em;
  font-size: 2.5em;
  top: 1.7em;
  left: initial;
  right: 0.25em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${rightAlignment};

  > span {
    text-align: right;
    width: 1.7em;
    bottom: 0.2em;
  }
`

const counterCss = css`
  justify-self: end;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  > span {
    text-align: right;
    bottom: 0.2em;
  }
`
