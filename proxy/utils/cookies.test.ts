import { filterCookie } from './cookies'

describe('filterCookies', () => {
  const predicate = (key: string) => key === '_iidt'

  it('the same result', () => {
    const value = '_iidt=sfdsafdasf'
    expect(filterCookie(value, predicate)).toBe(value)
  })

  it('reduce', () => {
    const value = '_iidt=aass; vid_t=xcvbnm'
    expect(filterCookie(value, predicate)).toBe('_iidt=aass')
  })

  it('empty', () => {
    expect(filterCookie('', predicate)).toBe('')
  })

  it('no value', () => {
    expect(filterCookie('_iidt', predicate)).toBe('')
  })

  it('with equal signs', () => {
    const value = '_iidt=7A03Gwg==; _vid_t=gEFRuIQlzYmv692/UL4GLA=='
    expect(filterCookie(value, predicate)).toBe('_iidt=7A03Gwg==')
  })
})
