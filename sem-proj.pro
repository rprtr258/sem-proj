QT += quick qml opengl
CONFIG += c++11

# The following define makes your compiler emit warnings if you use
# any feature of Qt which as been marked deprecated (the exact warnings
# depend on your compiler). Please consult the documentation of the
# deprecated API in order to know how to port your code away from it.
DEFINES += QT_DEPRECATED_WARNINGS

# You can also make your code fail to compile if you use deprecated APIs.
# In order to do so, uncomment the following line.
# You can also select to disable deprecated APIs only up to a certain version of Qt.
DEFINES += QT_DISABLE_DEPRECATED_BEFORE=0x060000    # disables all the APIs deprecated before Qt 6.0.0

SOURCES += \
        main.cpp \
        mainwidget.cpp \
        world.cpp \
        player.cpp \
        map.cpp \
        bullet.cpp \
        gun.cpp \
        laser.cpp \
        lasergun.cpp \
        grenade.cpp \
        grenadegun.cpp \
        creature.cpp \
        observer.cpp \
        projectile.cpp \
        weapon.cpp \
        bot.cpp \
        character.cpp

RESOURCES += qml.qrc

# Default rules for deployment.
qnx: target.path = /tmp/$${TARGET}/bin
else: unix:!android: target.path = /opt/$${TARGET}/bin
!isEmpty(target.path): INSTALLS += target

HEADERS += \
        mainwidget.h \
        world.h \
        player.h \
        map.h \
        observer.h \
        bullet.h \
        creature.h \
        weapon.h \
        gun.h \
        projectile.h \
        laser.h \
        lasergun.h \
        grenadegun.h \
        grenade.h \
        bot.h \
        character.h

SUBDIRS += \
    sem-proj.pro

DISTFILES +=
