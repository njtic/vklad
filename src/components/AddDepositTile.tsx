type AddDepositTileProps = {
  onClick: () => void
}

export function AddDepositTile({ onClick }: AddDepositTileProps) {
  return (
    <button
      type="button"
      className="add-deposit-tile"
      onClick={onClick}
      data-testid="add-deposit-tile"
      aria-label="Добавить новый вклад"
    >
      <span className="add-deposit-tile__icon" aria-hidden="true">
        +
      </span>
      <strong>Добавить вклад</strong>
      <span>Новый вклад появится на этом экране</span>
    </button>
  )
}
