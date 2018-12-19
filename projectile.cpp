#include "character.h"
#include "projectile.h"

Projectile::Projectile(QQuickItem *item, Map *map, qint32 damage, qint32 ownerId) : m_item(item), m_map(map), m_damage(damage), m_ownerId(ownerId) {}
