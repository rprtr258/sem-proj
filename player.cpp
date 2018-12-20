#include "player.h"

Player::Player(Map *map, Bridge *view, QQuickItem *item, QPoint position) : Character(map, view, item, position) {
    m_id = 0;
}
