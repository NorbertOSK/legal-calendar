import { useEffect } from 'react'
import { Select } from '@/shared/components/Select'
import { getAvailableCountries, getTimezonesByCountry } from '@/shared/utils/timezone'

interface TimezoneSelectorProps {
  country: string
  timezone: string
  onCountryChange: (country: string) => void
  onTimezoneChange: (tz: string) => void
  countryError?: string
  timezoneError?: string
}

export function TimezoneSelector({
  country,
  timezone,
  onCountryChange,
  onTimezoneChange,
  countryError,
  timezoneError,
}: TimezoneSelectorProps) {
  const countries = getAvailableCountries()
  const countryOptions = countries.map((c) => ({ value: c, label: c }))
  const timezoneOptions = country ? getTimezonesByCountry(country) : []

  useEffect(() => {
    if (timezoneOptions.length === 1 && timezone !== timezoneOptions[0].value) {
      onTimezoneChange(timezoneOptions[0].value)
    }
  }, [timezoneOptions, timezone, onTimezoneChange])

  return (
    <>
      <Select
        label="Pais"
        options={countryOptions}
        placeholder="Seleccionar pais"
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        error={countryError}
      />
      {timezoneOptions.length > 1 && (
        <Select
          label="Zona horaria"
          options={timezoneOptions}
          placeholder="Seleccionar zona horaria"
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          error={timezoneError}
        />
      )}
    </>
  )
}
