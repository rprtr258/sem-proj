#include "character.h"
#include "projectile.h"

Projectile::Projectile(QQuickItem *item, Map *map, qint32 damage) : m_damage(damage), m_item(item), m_map(map) {}

void Projectile::affect(Character *character) {
    character->hit(m_damage);
}
