#include "player.h"

bool Player::update() {
    setHealth(((m_health + (rand() % 2 ? 1 : -1)) % 101 + 101) % 101);
    setMana(((m_health + (rand() % 2 ? 1 : -1)) % 101 + 101) % 101);
    if (m_goingLeft != m_goingRight) {
        if (m_goingLeft) {
            if (not m_spriteFlipped)
                flipSprite();
            moveHorizontal(-5);
        }
        if (m_goingRight) {
            if (m_spriteFlipped)
                flipSprite();
            moveHorizontal(5);
        }
    }
    if (m_jumping and m_map->isFilled(m_boundingBox.translated(0, 1))) {
        m_inAir = true;
        m_vspeed = 30;
    } else if (!m_jumping and m_map->isFilled(m_boundingBox.translated(0, 1))) {
        m_inAir = false;
    }
    moveVertical(10 - m_vspeed);
    m_vspeed = std::max(m_vspeed - 1, 0);
    m_reload = std::max(m_reload - 1, 0);

    m_item->setPosition(m_coord);
    m_item->setProperty("mirrored", m_spriteFlipped);
    m_item->setProperty("going", m_goingLeft xor m_goingRight);
    m_item->setProperty("inAir", m_inAir);
    m_item->setProperty("health", m_health);
    m_item->setProperty("mana", m_mana);
    m_item->setProperty("attack", m_reload != 0);
    return false;
}
