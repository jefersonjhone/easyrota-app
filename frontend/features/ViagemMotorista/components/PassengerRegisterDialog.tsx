import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { NativeSelect, NativeSelectOption } from '@ui/native-select'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@ui/dialog'
import { UserPlusIcon } from '@phosphor-icons/react'
import { cn } from '@utils'
import type { FormEvent } from 'react'
import type { PassengerKind } from '../types'
import type { AllowedStaffOption } from '@features/trips/types'


type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  passengerKind: PassengerKind
  onPassengerKindChange: (kind: PassengerKind) => void
  passengerStaffQuery: string
  onPassengerStaffQueryChange: (value: string) => void
  staffOptions: AllowedStaffOption[]
  isStaffSearchLoading: boolean
  staffSearchError: string | null
  selectedStaff: AllowedStaffOption | null
  onSelectStaff: (staff: AllowedStaffOption) => void
  isGuestPassenger: boolean
  passengerName: string
  onPassengerNameChange: (value: string) => void
  passengerCpf: string
  onPassengerCpfChange: (value: string) => void
  guestWithoutServer: boolean
  onGuestWithoutServerChange: (value: boolean) => void
  isPassengerSaving: boolean
  actionError: string | null
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function PassengerRegisterDialog({
  isOpen,
  onOpenChange,
  passengerKind,
  onPassengerKindChange,
  passengerStaffQuery,
  onPassengerStaffQueryChange,
  staffOptions,
  isStaffSearchLoading,
  staffSearchError,
  selectedStaff,
  onSelectStaff,
  isGuestPassenger,
  passengerName,
  onPassengerNameChange,
  passengerCpf,
  onPassengerCpfChange,
  guestWithoutServer,
  onGuestWithoutServerChange,
  isPassengerSaving,
  actionError,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <form className="grid gap-5" onSubmit={onSubmit}>
          <DialogHeader className="items-center text-center">
            <UserPlusIcon aria-hidden="true" weight="fill" className="size-8 text-primary" />
            <DialogTitle>Cadastrar passageiro</DialogTitle>
            <DialogDescription>Busque o servidor autorizado e registre o embarque local.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="driver-passenger-kind">Tipo</Label>
            <NativeSelect
              id="driver-passenger-kind"
              value={passengerKind}
              onChange={(event) => onPassengerKindChange(event.target.value as PassengerKind)}
              className="w-full"
            >
              <NativeSelectOption value="Servidor">Servidor</NativeSelectOption>
              <NativeSelectOption value="Convidado">Convidado</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="driver-passenger-staff-search">{isGuestPassenger ? 'Servidor associado' : 'Servidor'}</Label>
            <Input
              id="driver-passenger-staff-search"
              type="text"
              value={passengerStaffQuery}
              onChange={(event) => onPassengerStaffQueryChange(event.target.value)}
              placeholder="Digite nome ou matricula"
              autoFocus
              required
            />

            {isStaffSearchLoading ? (<p className="text-xs font-semibold text-muted-foreground">Buscando servidores...</p>) : null}
            {staffSearchError ? (<p className="text-xs font-semibold text-red-700">{staffSearchError}</p>) : null}

            {staffOptions.length > 0 ? (
              <div role="listbox" aria-label="Servidores encontrados" className="max-h-44 overflow-y-auto rounded-lg border border-border bg-background p-1">
                {staffOptions.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id

                  return (
                    <button
                      key={staff.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        'flex w-full min-w-0 flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors',
                        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                      )}
                      onClick={() => onSelectStaff(staff)}
                    >
                      <span className="w-full truncate text-sm font-bold">{staff.name}</span>
                      <span className={cn('text-xs font-semibold', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                        Matricula {staff.registration_number}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}

            {!isStaffSearchLoading && passengerStaffQuery.trim().length >= 2 && staffOptions.length === 0 && !staffSearchError ? (
              <p className="text-xs font-semibold text-muted-foreground">Nenhum servidor encontrado.</p>
            ) : null}

            {selectedStaff ? (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">{selectedStaff.name} - matricula {selectedStaff.registration_number}</p>
            ) : null}
          </div>

          {isGuestPassenger ? (
            <>
              <div className="grid gap-1">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Checkbox
                    id="driver-guest-without-server"
                    checked={guestWithoutServer}
                    onCheckedChange={(checked) => onGuestWithoutServerChange(checked === true)}
                  />
                  <Label htmlFor="driver-guest-without-server" className="text-sm font-semibold leading-5">
                    este convidado vai viajar sem servidor
                  </Label>
                </div>
                <p className="pl-7 text-xs font-bold text-red-700">
                  Necessário autorização da Uninfra
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-name">Nome do convidado</Label>
                <Input id="driver-passenger-name" type="text" value={passengerName} onChange={(event) => onPassengerNameChange(event.target.value)} required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="driver-passenger-cpf">CPF do convidado</Label>
                <Input id="driver-passenger-cpf" type="text" inputMode="numeric" maxLength={11} value={passengerCpf} onChange={(event) => onPassengerCpfChange(event.target.value.replace(/\D/g, ''))} required />
              </div>
            </>
          ) : null}

          {actionError ? (<p role="alert" className="text-sm font-bold text-red-700">{actionError}</p>) : null}

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={onCancel} disabled={isPassengerSaving}>Cancelar</Button>
            <Button type="submit" className="rounded-lg" disabled={!selectedStaff || isPassengerSaving}>{isPassengerSaving ? 'Cadastrando...' : 'Cadastrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
