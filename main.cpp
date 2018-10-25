#include <QApplication>
#include "bullet.h"
#include "mainwidget.h"

qint32 main(qint32 argc, char *argv[]) {
    QApplication app(argc, argv);

    MainWidget mainWidget;
    mainWidget.show();
    qmlRegisterType<Bullet>("org.examples", 1, 0, "Bullet");

    return app.exec();
}
